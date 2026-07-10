import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  authService = inject(AuthService);
  private router = inject(Router);

  query = '';
  private debounceHandle?: ReturnType<typeof setTimeout>;

  initials = computed(() => {
    const email = this.authService.user()?.email ?? '';
    return email.slice(0, 2).toUpperCase();
  });

  onSearchInput(event: Event) {
    this.query = (event.target as HTMLInputElement).value;
    clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => this.commitSearch(), 350);
  }

  onSearchEnter() {
    clearTimeout(this.debounceHandle);
    this.commitSearch();
  }

  clearSearch() {
    this.query = '';
    clearTimeout(this.debounceHandle);
  }

  private commitSearch() {
    const q = this.query.trim();
    if (q.length >= 2) {
      this.router.navigate(['/buscar'], { queryParams: { q } });
    }
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigateByUrl('/');
  }
}
