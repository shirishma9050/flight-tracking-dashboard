import { Routes } from '@angular/router';
import { DashboardHomeComponent } from '@features/Flight/dashboard-home/dashboard-home.component';
import { FlightSelectedComponent } from '@features/flight-selected/flight-selected.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardHomeComponent
  },
  {
    path: 'flights/:flightNumber',
    component: FlightSelectedComponent
  },
  {
    path: '**',
    redirectTo: ''
  }
];
