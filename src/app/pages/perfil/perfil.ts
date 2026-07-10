import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PreferencesService } from '../../services/preferences.service';
import { UserPreferences } from '../../models/preferences.model';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  authService = inject(AuthService);
  private preferencesService = inject(PreferencesService);
  private router = inject(Router);

  prefs = signal<UserPreferences | null>(null);
  loadingPrefs = signal(true);

  initials = computed(() => (this.authService.user()?.email ?? '').slice(0, 2).toUpperCase());

  memberSince = computed(() => {
    const created = this.authService.user()?.created_at;
    if (!created) return '';
    return new Date(created).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  });

  async ngOnInit() {
    const userId = this.authService.user()?.id;
    if (!userId) {
      this.loadingPrefs.set(false);
      return;
    }
    this.prefs.set(await this.preferencesService.getPreferences(userId));
    this.loadingPrefs.set(false);
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigateByUrl('/');
  }
}
