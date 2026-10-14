import { Routes } from '@angular/router';
import { Actividades } from './actividades/actividades';
import { Cobro } from './cobros/cobro';
import { DashboardComponent } from './dashboard/dashboard';
import { Precios } from './precios/precios';
import { FichaSocioComponent } from './socios/ficha-socio';
import { RegistroSocio } from './socios/registro-socio';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'actividades', component: Actividades },
  { path: 'precios', component: Precios },
  { path: 'socios/nuevo', component: RegistroSocio },
  { path: 'socios/:id', component: FichaSocioComponent },
  { path: 'cobros/:socioId', component: Cobro },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
