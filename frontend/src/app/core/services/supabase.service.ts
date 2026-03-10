import { Injectable, signal, computed, inject } from '@angular/core';
import {
  createClient,
  SupabaseClient,
  Session,
  AuthChangeEvent,
} from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

export interface Reservation {
  id?: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
  created_at?: string;
}

export interface SiteConfig {
  key: string;
  value: string;
}

/** 0 = Monday … 6 = Sunday */
export interface ScheduleDay {
  day_of_week: number;
  is_closed: boolean;
  shift1_start: string | null;
  shift1_end: string | null;
  shift2_start: string | null;
  shift2_end: string | null;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
  );

  // ── Auth ──────────────────────────────────────────────────────────────────

  getClient(): SupabaseClient {
    return this.client;
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ) {
    return this.client.auth.onAuthStateChange(callback);
  }

  async signInWithPassword(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  async signInWithGoogle(redirectTo?: string) {
    return this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo || window.location.href },
    });
  }

  async signOut() {
    return this.client.auth.signOut();
  }

  // ── Menu PDF (Supabase Storage) ───────────────────────────────────────────

  getMenuPdfUrl(): string {
    const { data } = this.client.storage
      .from('menu-pdf')
      .getPublicUrl('menu.pdf');
    return data.publicUrl;
  }

  async uploadMenuPdf(file: File): Promise<{ error: unknown }> {
    const { error } = await this.client.storage
      .from('menu-pdf')
      .upload('menu.pdf', file, { upsert: true });
    return { error };
  }

  // ── Reservations ──────────────────────────────────────────────────────────

  async createReservation(
    reservation: Omit<Reservation, 'id' | 'status' | 'created_at'>,
  ) {
    return this.client
      .from('reservations')
      .insert({ ...reservation, status: 'pending' });
  }

  async getReservations() {
    return this.client
      .from('reservations')
      .select('*')
      .order('date', { ascending: true });
  }

  async updateReservationStatus(
    id: string,
    status: Reservation['status'],
  ) {
    return this.client
      .from('reservations')
      .update({ status })
      .eq('id', id);
  }

  async deleteReservation(id: string) {
    return this.client.from('reservations').delete().eq('id', id);
  }

  // ── Site Config ───────────────────────────────────────────────────────────

  async getSiteConfig(): Promise<Record<string, string>> {
    const { data, error } = await this.client
      .from('site_config')
      .select('key, value');

    if (error || !data) return {};

    return Object.fromEntries(data.map((row: SiteConfig) => [row.key, row.value]));
  }

  async updateSiteConfig(key: string, value: string) {
    return this.client
      .from('site_config')
      .upsert({ key, value }, { onConflict: 'key' });
  }

  // ── Admin Users ───────────────────────────────────────────────────────────

  async isAdminUser(userId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    return !error && data !== null;
  }

  // ── Restaurant Schedule ───────────────────────────────────────────────────

  async getSchedule(): Promise<ScheduleDay[]> {
    const { data, error } = await this.client
      .from('restaurant_schedule')
      .select('*')
      .order('day_of_week', { ascending: true });

    if (error || !data) return [];
    return data as ScheduleDay[];
  }

  async getScheduleForDay(dayOfWeek: number): Promise<ScheduleDay | null> {
    const { data } = await this.client
      .from('restaurant_schedule')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
    return data ?? null;
  }

  async saveScheduleDay(day: ScheduleDay): Promise<{ error: unknown }> {
    const { error } = await this.client
      .from('restaurant_schedule')
      .upsert(day, { onConflict: 'day_of_week' });
    return { error };
  }

  // ── Availability / Capacity ───────────────────────────────────────────────

  async checkReservationCapacity(
    date: string,
    time: string,
    guests: number,
  ): Promise<CapacityCheckResult> {
    const { data, error } = await this.client.rpc('check_reservation_capacity', {
      p_date:   date,
      p_time:   time,
      p_guests: guests,
    });

    if (error || !data) {
      // Fail open: let the DB constraint catch it instead of blocking the user
      console.error('Capacity check RPC error:', error);
      return { available: true, booked: 0, max: 0 };
    }

    return data as CapacityCheckResult;
  }
}

export type CapacityCheckResult =
  | { available: true;  booked: number; max: number }
  | { available: false; reason: 'per_reservation_limit'; max: number }
  | { available: false; reason: 'capacity_full'; booked: number; max: number };
