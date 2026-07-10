import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

type AuthMode = 'login' | 'signup';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  mode = signal<AuthMode>('login');
  email = '';
  password = '';
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);
  infoMsg = signal<string | null>(null);
  showPassword = signal(false);

  constructor(
    private authService: AuthService,
    private router: Router,
    route: ActivatedRoute
  ) {
    if (route.snapshot.queryParamMap.get('mode') === 'signup') {
      this.mode.set('signup');
    }
  }

  toggleMode() {
    this.mode.set(this.mode() === 'login' ? 'signup' : 'login');
    this.errorMsg.set(null);
    this.infoMsg.set(null);
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  async submit() {
    if (!this.email || !this.password) {
      this.errorMsg.set('Ingresa tu email y contraseña.');
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.infoMsg.set(null);

    if (this.mode() === 'login') {
      const { error } = await this.authService.signIn(this.email, this.password);
      this.isLoading.set(false);
      if (error) {
        this.errorMsg.set(error.message);
        return;
      }
      this.router.navigateByUrl('/');
      return;
    }

    const { error, session } = await this.authService.signUp(this.email, this.password);
    this.isLoading.set(false);

    if (error) {
      this.errorMsg.set(error.message);
      return;
    }

    if (session) {
      this.router.navigateByUrl('/');
      return;
    }

    this.infoMsg.set('Cuenta creada. Revisa tu correo para confirmar antes de iniciar sesión.');
  }
}
