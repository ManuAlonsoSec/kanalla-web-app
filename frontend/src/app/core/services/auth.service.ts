import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  // ── State ─────────────────────────────────────────────────────────────────
  readonly session = signal<Session | null>(null);
  readonly isAdmin = signal<boolean>(false);

  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);

  constructor() {
    // Bootstrap: read the current session once
    this.supabase.getSession().then((session) => {
      this.session.set(session);
      if (session?.user) {
        this.checkAdmin(session.user.id);
      }
    });

    // Subscribe to auth state changes
    this.supabase.onAuthStateChange((_event, session) => {
      this.session.set(session);
      if (session?.user) {
        this.checkAdmin(session.user.id);
      } else {
        this.isAdmin.set(false);
      }
    });
  }


  // ── Auth Actions ──────────────────────────────────────────────────────────

  async signInWithPassword(
    email: string,
    password: string,
  ): Promise<{ error: string | null; isAdmin: boolean }> {
    const { data, error } = await this.supabase.signInWithPassword(email, password);
    if (error) return { error: error.message, isAdmin: false };

    // Await the admin check directly — do not rely on a signal settling
    const adminResult = data.user ? await this.checkAdmin(data.user.id) : false;
    return { error: null, isAdmin: adminResult };
  }

  async signInWithGoogle(redirectTo?: string): Promise<void> {
    await this.supabase.signInWithGoogle(redirectTo);
  }

  async getSession() {
    return this.supabase.getSession();
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.session.set(null);
    this.isAdmin.set(false);
    this.router.navigate(['/']);
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private async checkAdmin(userId: string): Promise<boolean> {
    const result = await this.supabase.isAdminUser(userId);
    this.isAdmin.set(result);
    return result;
  }
}
