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
import { Injectable }    from '@angular/core';

import { HutchApiService } from './hutch-api.service';

import 'rxjs/add/operator/toPromise';

import { Profile } from './profile';

@Injectable()
export class HutchProfileService {

  constructor(private hutchApiService: HutchApiService) { }

  getProfile(): Promise<Profile> {
    return this.hutchApiService.httpRequest('GET', '/profile');
  }

  setProfile(profile: Profile): Promise<void> {
    return this.hutchApiService.httpRequest('PUT', '/profile', null, profile);
  }
}
