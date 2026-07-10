import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UserPreferences } from '../models/preferences.model';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private supabase = inject(SupabaseService);

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await this.supabase.client
      .from('user_preferences')
      .select('preferences')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data['preferences'] as UserPreferences;
  }

  async savePreferences(userId: string, preferences: UserPreferences): Promise<void> {
    await this.supabase.client
      .from('user_preferences')
      .upsert(
        { user_id: userId, preferences, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  }

  async clearPreferences(userId: string): Promise<void> {
    await this.supabase.client.from('user_preferences').delete().eq('user_id', userId);
  }
}
