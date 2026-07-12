import { Routes } from '@angular/router';
import { Client } from './client/client';
import { Attendant } from './attendant/attendant';

export const routes: Routes = [
  { path: '', component: Client },
  { path: 'atendente', component: Attendant },
];
