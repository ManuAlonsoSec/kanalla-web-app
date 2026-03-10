import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService, Reservation } from '../../../core/services/supabase.service';
import { ScheduleEditorComponent } from '../schedule-editor/schedule-editor.component';
import { CapacityEditorComponent } from '../capacity-editor/capacity-editor.component';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ScheduleEditorComponent, CapacityEditorComponent],
})
export class AdminDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly reservations = signal<Reservation[]>([]);
  readonly loadingReservations = signal(true);
  readonly uploadStatus = signal<'idle' | 'uploading' | 'success' | 'error'>('idle');
  readonly activeTab = signal<'reservations' | 'menu' | 'schedule' | 'capacity'>('reservations');
  readonly menuOpen = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadReservations();
  }

  async loadReservations(): Promise<void> {
    this.loadingReservations.set(true);
    const { data } = await this.supabase.getReservations();
    this.reservations.set((data as Reservation[]) ?? []);
    this.loadingReservations.set(false);
  }

  async updateStatus(id: string, status: Reservation['status']): Promise<void> {
    await this.supabase.updateReservationStatus(id, status);
    await this.loadReservations();
  }

  async deleteReservation(id: string): Promise<void> {
    if (!confirm('¿Eliminar esta reserva?')) return;
    await this.supabase.deleteReservation(id);
    await this.loadReservations();
  }

  async onPdfUpload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadStatus.set('uploading');
    const { error } = await this.supabase.uploadMenuPdf(file);

    if (error) {
      this.uploadStatus.set('error');
      return;
    }

    // Update site_config with the new PDF URL
    const url = this.supabase.getMenuPdfUrl();
    await this.supabase.updateSiteConfig('menu_pdf_url', url);
    this.uploadStatus.set('success');
  }

  setTab(tab: 'reservations' | 'menu' | 'schedule' | 'capacity'): void {
    this.activeTab.set(tab);
    this.closeMenu();
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.auth.signOut();
  }
}
