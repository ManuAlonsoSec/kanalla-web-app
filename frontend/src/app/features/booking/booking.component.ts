import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  effect,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SupabaseService } from '../../core/services/supabase.service';
import { AuthService } from '../../core/services/auth.service';

const PENDING_RESERVATION_KEY = 'kanalla_pending_reservation';

/**
 * Groups of this size or above must call the restaurant directly.
 * This is a hard business rule, not configurable from the admin panel.
 */
const CALL_THRESHOLD = 10;

type BookingStatus = 'idle' | 'submitting' | 'auth' | 'success' | 'error' | 'full';

// ── Slot generation helpers ───────────────────────────────────────────────────

/** Convert 'HH:MM' to total minutes since midnight. */
function toMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Generate 30-minute slots within [start, end).
 * A shift ending at '00:00' is treated as 24:00 (midnight) so that e.g.
 * Friday's last slot is 23:30.
 */
function generateSlots(start: string, end: string): string[] {
  const startMins = toMins(start);
  const endMins   = toMins(end) === 0 ? 24 * 60 : toMins(end);
  const slots: string[] = [];
  for (let m = startMins; m < endMins; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

/**
 * Map a JS Date's getDay() (0=Sun … 6=Sat) to the DB convention (0=Mon … 6=Sun).
 */
function jsToDbDow(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1;
}

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
})
export class BookingComponent implements OnInit, OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private readonly auth     = inject(AuthService);
  private readonly fb       = inject(FormBuilder);

  private dateSubscription?: Subscription;

  readonly status       = signal<BookingStatus>('idle');
  readonly errorMessage = signal<string>('');

  /**
   * Total restaurant capacity used for the ±1h window check.
   * Loaded from site_config.max_guests — admin-configurable.
   * Does NOT control the per-reservation form limit (that is CALL_THRESHOLD).
   */
  readonly maxGuests = signal<number>(40);

  // ── Time slot signals ─────────────────────────────────────────────────────

  /**
   * 30-minute slots available for the currently selected date.
   * Empty array = no date chosen yet or day is fully closed.
   */
  readonly availableSlots = signal<string[]>([]);

  /** True while the schedule is being fetched after a date change. */
  readonly slotsLoading = signal<boolean>(false);

  /** True when the schedule says the restaurant is closed on the chosen day. */
  readonly dayIsClosed = signal<boolean>(false);

  // ─────────────────────────────────────────────────────────────────────────

  readonly form = this.fb.nonNullable.group({
    name:   ['', [Validators.required, Validators.minLength(2)]],
    email:  ['', [Validators.required, Validators.email]],
    phone:  ['', [Validators.required, Validators.pattern(/^[+\d\s\-()]{7,}$/)]],
    date:   ['', Validators.required],
    time:   ['', Validators.required],
    // Hard limit: CALL_THRESHOLD - 1 = 9. Never changes regardless of max_guests.
    guests: [2, [Validators.required, Validators.min(1), Validators.max(CALL_THRESHOLD - 1)]],
    notes:  [''],
  });

  constructor() {
    // React to authentication status to process pending reservations
    effect(() => {
      const isAuth = this.auth.isAuthenticated();
      const pending = sessionStorage.getItem(PENDING_RESERVATION_KEY);

      if (isAuth && pending && this.status() === 'idle') {
        this.processPending(pending);
      }
    });
  }

  get today(): string {
    return new Date().toISOString().split('T')[0];
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async ngOnInit(): Promise<void> {
    // Load total capacity for the window check — does NOT affect the form validator
    const config = await this.supabase.getSiteConfig();
    const raw = config['max_guests'];
    if (raw) {
      const limit = parseInt(raw, 10);
      if (!isNaN(limit) && limit > 0) {
        this.maxGuests.set(limit);
      }
    }

    // Watch for date changes → refresh available slots
    this.dateSubscription = this.form.controls.date.valueChanges.subscribe(
      (dateStr) => this.onDateChange(dateStr),
    );
  }

  ngOnDestroy(): void {
    this.dateSubscription?.unsubscribe();
  }

  // ── Date change handler ────────────────────────────────────────────────────

  private async onDateChange(dateStr: string): Promise<void> {
    // Reset time whenever the date changes
    this.form.controls.time.reset('');
    this.availableSlots.set([]);
    this.dayIsClosed.set(false);

    if (!dateStr) return;

    this.slotsLoading.set(true);

    const date    = new Date(dateStr + 'T12:00:00'); // noon to avoid TZ issues
    const dbDow   = jsToDbDow(date.getDay());
    const schedule = await this.supabase.getScheduleForDay(dbDow);

    if (!schedule || schedule.is_closed) {
      this.dayIsClosed.set(true);
      this.slotsLoading.set(false);
      return;
    }

    const slots: string[] = [];

    if (schedule.shift1_start && schedule.shift1_end) {
      slots.push(...generateSlots(schedule.shift1_start, schedule.shift1_end));
    }
    if (schedule.shift2_start && schedule.shift2_end) {
      slots.push(...generateSlots(schedule.shift2_start, schedule.shift2_end));
    }

    this.availableSlots.set(slots);
    this.slotsLoading.set(false);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  private async processPending(pending: string): Promise<void> {
    sessionStorage.removeItem(PENDING_RESERVATION_KEY);
    try {
      const reservation = JSON.parse(pending);
      this.status.set('submitting');
      await this.submitReservation(reservation);
    } catch (e) {
      console.error('Error parsing pending reservation', e);
    }
  }

  // ── Form submit ────────────────────────────────────────────────────────────

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const session = await this.auth.getSession();

    if (!session) {
      // Not authenticated — stash form data and trigger Google OAuth
      sessionStorage.setItem(
        PENDING_RESERVATION_KEY,
        JSON.stringify(this.form.getRawValue()),
      );
      this.status.set('auth');
      await this.auth.signInWithGoogle();
      // Execution stops here — page will reload after OAuth redirect
      return;
    }

    // Already authenticated — submit directly
    this.status.set('submitting');
    await this.submitReservation(this.form.getRawValue());
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private async submitReservation(data: ReturnType<typeof this.form.getRawValue>): Promise<void> {
    // ── Capacity pre-check ─────────────────────────────────────────────────
    const check = await this.supabase.checkReservationCapacity(
      data.date,
      data.time,
      data.guests,
    );

    if (!check.available) {
      if (check.reason === 'per_reservation_limit') {
        this.errorMessage.set(
          `Para reservas de ${check.max} o más personas, por favor llámanos directamente.`,
        );
      } else {
        this.errorMessage.set(
          'Lo sentimos, el restaurante está al máximo de aforo para esa franja horaria. ' +
          'Por favor, elige otro horario o llámanos para buscar una solución.',
        );
        this.status.set('full');
        return;
      }
      this.status.set('error');
      return;
    }

    // ── Insert reservation ────────────────────────────────────────────────
    const { error } = await this.supabase.createReservation(data);

    if (error) {
      this.errorMessage.set('Hubo un error al enviar la reserva. Por favor, inténtalo de nuevo.');
      this.status.set('error');
      return;
    }

    this.status.set('success');
    this.form.reset({ guests: 2 });
    this.availableSlots.set([]);
    this.dayIsClosed.set(false);
  }

  restart(): void {
    this.status.set('idle');
    this.errorMessage.set('');
  }
}
