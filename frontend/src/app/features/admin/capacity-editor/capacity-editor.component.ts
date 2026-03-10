import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';

const CONFIG_KEY = 'max_guests';
const MIN_GUESTS = 1;
const MAX_GUESTS = 500;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'app-capacity-editor',
  templateUrl: './capacity-editor.component.html',
  styleUrl: './capacity-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
})
export class CapacityEditorComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);

  readonly maxGuests = signal<number>(20);
  readonly loading = signal(true);
  readonly saveState = signal<SaveState>('idle');
  readonly validationError = signal<string>('');

  readonly min = MIN_GUESTS;
  readonly max = MAX_GUESTS;

  async ngOnInit(): Promise<void> {
    const config = await this.supabase.getSiteConfig();
    const raw = config[CONFIG_KEY];
    if (raw) {
      this.maxGuests.set(parseInt(raw, 10));
    }
    this.loading.set(false);
  }

  updateValue(raw: string | number): void {
    const val = typeof raw === 'string' ? parseInt(raw, 10) : raw;
    this.maxGuests.set(isNaN(val) ? 0 : val);
    this.validate();
  }

  private validate(): boolean {
    const v = this.maxGuests();
    if (isNaN(v) || v < MIN_GUESTS) {
      this.validationError.set(`El mínimo es ${MIN_GUESTS} persona.`);
      return false;
    }
    if (v > MAX_GUESTS) {
      this.validationError.set(`El máximo permitido es ${MAX_GUESTS}.`);
      return false;
    }
    this.validationError.set('');
    return true;
  }

  async save(): Promise<void> {
    if (!this.validate()) return;

    this.saveState.set('saving');
    const { error } = await this.supabase.updateSiteConfig(
      CONFIG_KEY,
      String(this.maxGuests()),
    );

    this.saveState.set(error ? 'error' : 'saved');

    setTimeout(() => this.saveState.set('idle'), 2500);
  }
}
