import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);

  readonly pdfUrl = signal<string>('');
  readonly loading = signal<boolean>(true);
  readonly isMobile = signal<boolean>(false);

  ngOnInit(): void {
    this.isMobile.set(window.innerWidth < 768);
    const url = this.supabase.getMenuPdfUrl();
    this.pdfUrl.set(url);
    this.loading.set(false);
  }
}
