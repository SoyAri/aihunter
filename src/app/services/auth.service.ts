import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthError, Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase = inject(SupabaseService);

  private readonly session = signal<Session | null>(null);
  readonly user = computed<User | null>(() => this.session()?.user ?? null);
  readonly isLoggedIn = computed(() => !!this.user());

  constructor() {
    this.supabase.client.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
    });

    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
    });
  }

  async signUp(
    email: string,
    password: string
  ): Promise<{ error: AuthError | null; session: Session | null }> {
    const { data, error } = await this.supabase.client.auth.signUp({ email, password });
    return { error, session: data.session };
  }

  async signIn(email: string, password: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    return { error };
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
  }
}
