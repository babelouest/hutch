import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { SafeComponent } from './safe/safe.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'safe/:name', component: SafeComponent }
];

export const routing = RouterModule.forRoot(routes);
