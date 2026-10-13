import { Routes } from '@angular/router';
import { Actividades } from './actividades/actividades';
import { Precios } from './precios/precios';

export const routes: Routes = [
  { path: 'actividades', component: Actividades },
  { path: 'precios', component: Precios },
  { path: '', redirectTo: 'actividades', pathMatch: 'full' },
];
