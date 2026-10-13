import { Routes } from '@angular/router';
import { Actividades } from './actividades/actividades';
import { Precios } from './precios/precios';
import { FichaSocioComponent } from './socios/ficha-socio';
import { RegistroSocio } from './socios/registro-socio';

export const routes: Routes = [
  { path: 'actividades', component: Actividades },
  { path: 'precios', component: Precios },
  { path: 'socios/nuevo', component: RegistroSocio },
  { path: 'socios/:id', component: FichaSocioComponent },
  { path: '', redirectTo: 'actividades', pathMatch: 'full' },
];
