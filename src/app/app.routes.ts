import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Login } from './pages/login/login';
import { Perfil } from './pages/perfil/perfil';
import { Buscar } from './pages/buscar/buscar';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Inicio, pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'perfil', component: Perfil, canActivate: [authGuard] },
  { path: 'buscar', component: Buscar },
  { path: '**', redirectTo: '' },
];
