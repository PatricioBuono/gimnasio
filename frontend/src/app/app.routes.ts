import { Routes } from '@angular/router';
import { Actividades } from './actividades/actividades';
import { Cobro } from './cobros/cobro';
import { Login } from './auth/login';
import { authGuard } from './core/auth.guard';
import { DashboardComponent } from './dashboard/dashboard';
import { Precios } from './precios/precios';
import { FichaSocioComponent } from './socios/ficha-socio';
import { RegistroSocio } from './socios/registro-socio';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'actividades', component: Actividades, canActivate: [authGuard] },
  { path: 'precios', component: Precios, canActivate: [authGuard] },
  { path: 'socios/nuevo', component: RegistroSocio, canActivate: [authGuard] },
  { path: 'socios/:id', component: FichaSocioComponent, canActivate: [authGuard] },
  { path: 'cobros/:socioId', component: Cobro, canActivate: [authGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
