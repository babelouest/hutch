/**
 *
 * Hutch - Password and private data locker
 *
 * Application front-end
 *
 * Copyright 2017 Nicolas Mora <mail@babelouest.org>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License
 * License as published by the Free Software Foundation;
 * version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { SafeComponent } from './safe/safe.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'safe/:name', component: SafeComponent }
];

export const routing = RouterModule.forRoot(routes);
