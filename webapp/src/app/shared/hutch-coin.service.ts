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

import { Coin } from './coin';

@Injectable()
export class HutchCoinService {

  constructor(private hutchApiService: HutchApiService) { }

  list(safe: string): Promise<Coin[]> {
    return this.hutchApiService.httpRequest('GET', '/safe/' + safe + '/coin/');
  }

  get(safe: string, name: string): Promise<Coin> {
    return this.hutchApiService.httpRequest('GET', '/safe/' + safe + '/coin/' + name);
  }

  add(safe: string, coin: Coin): Promise<void> {
    return this.hutchApiService.httpRequest('POST', '/safe/' + safe + '/coin/', null, coin);
  }

  set(safe: string, name: string, coin: Coin): Promise<void> {
    return this.hutchApiService.httpRequest('PUT', '/safe/' + safe + '/coin/' + name, null, coin);
  }

  delete(safe: string, name: string): Promise<void> {
    return this.hutchApiService.httpRequest('DELETE', '/safe/' + safe + '/coin/' + name);
  }
}
