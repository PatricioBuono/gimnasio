import { Routes } from '@angular/router';
import { Actividades } from './actividades/actividades';
import { Cobro } from './cobros/cobro';
import { Login } from './auth/login';
import { authGuard } from './core/auth.guard';
import { DashboardComponent } from './dashboard/dashboard';
import { Precios } from './precios/precios';
import { FichaSocioComponent } from './socios/ficha-socio';
import { RegistroSocio } from './socios/registro-socio';
import { PublicLayout } from './layout/public-layout';
import { PrivateLayout } from './layout/private-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: 'login', component: Login },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    component: PrivateLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'actividades', component: Actividades },
      { path: 'precios', component: Precios },
      { path: 'socios/nuevo', component: RegistroSocio },
      { path: 'socios/:id', component: FichaSocioComponent },
      { path: 'cobros/:socioId', component: Cobro },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
