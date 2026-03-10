import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService, ScheduleDay } from '../../../core/services/supabase.service';

export const DAY_NAMES = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo',
];

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface DayRow extends ScheduleDay {
  saveState: SaveState;
}

@Component({
  selector: 'app-schedule-editor',
  templateUrl: './schedule-editor.component.html',
  styleUrl: './schedule-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class ScheduleEditorComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);

  readonly days = signal<DayRow[]>([]);
  readonly loading = signal(true);

  readonly dayNames = DAY_NAMES;

  async ngOnInit(): Promise<void> {
    const raw = await this.supabase.getSchedule();
    // Ensure all 7 days exist even if DB has gaps
    const map = new Map(raw.map((d) => [d.day_of_week, d]));
    const rows: DayRow[] = Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      is_closed: false,
      shift1_start: '13:00',
      shift1_end: '17:00',
      shift2_start: '20:00',
      shift2_end: '23:00',
      ...map.get(i),
      saveState: 'idle',
    }));
    this.days.set(rows);
    this.loading.set(false);
  }

  async saveDay(index: number): Promise<void> {
    const rows = [...this.days()];
    const day = rows[index];
    rows[index] = { ...day, saveState: 'saving' };
    this.days.set(rows);

    // If closed, clear shift times before saving
    const payload: ScheduleDay = day.is_closed
      ? { ...day, shift1_start: null, shift1_end: null, shift2_start: null, shift2_end: null }
      : { ...day };
    delete (payload as Partial<DayRow>).saveState;

    const { error } = await this.supabase.saveScheduleDay(payload);

    const updated = [...this.days()];
    updated[index] = { ...updated[index], saveState: error ? 'error' : 'saved' };
    this.days.set(updated);

    // Reset feedback after 2.5 s
    setTimeout(() => {
      const reset = [...this.days()];
      reset[index] = { ...reset[index], saveState: 'idle' };
      this.days.set(reset);
    }, 2500);
  }

  updateDay(index: number, patch: Partial<DayRow>): void {
    const rows = [...this.days()];
    rows[index] = { ...rows[index], ...patch };
    this.days.set(rows);
  }
}
