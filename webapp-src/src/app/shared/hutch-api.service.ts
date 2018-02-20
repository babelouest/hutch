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
import { Injectable, isDevMode }    from '@angular/core';
import { Headers, Http, RequestOptions, URLSearchParams } from '@angular/http';

import { Oauth2ConnectObservable } from '../oauth2-connect/oauth2-connect.service';
import { HutchConfigService } from './hutch-config.service';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class HutchApiService {
  private headers = new Headers({
    'Content-Type': 'application/json'
  });

  // TODO: Use config service
  private hutchApiBasehUrl = '';

  constructor(private http: Http, private oauth2Connect: Oauth2ConnectObservable, private config: HutchConfigService) {
    this.config.get()
    .then(curConfig => {
      this.hutchApiBasehUrl = curConfig.api.baseUrl;
    })
    .catch((error) => {
      if (isDevMode()) {
        console.log('Hutch debug', error);
      }
    });
    this.oauth2Connect.getToken().subscribe((token) => {
      if (token) {
        this.headers.set('Authorization', 'Bearer ' + token);
      } else {
        this.headers.delete('Authorization');
      }
    });
  }

  httpRequest(method: string, url: string, search?: Map<string, string[]>, data?: any): Promise<any> {
    if (this.headers.get('Authorization')) {
      let searchParams: URLSearchParams = new URLSearchParams();
      if (search) {
        searchParams.paramsMap = search;
      }
      let options: RequestOptions = new RequestOptions({
        method: method,
        url: this.hutchApiBasehUrl + url,
        search: searchParams,
        body: JSON.stringify(data),
        headers: this.headers
      });
      return this.http.request(url, options)
                 .toPromise()
                 .then((result) => {
                   if (result.text()) {
                    return result.json();
                   } else {
                     return '';
                   }
                 })
                 .catch((error) => {
                   if (error.status === 401) {
                     // Token expired or disabled
                     this.headers.delete('Authorization');
                   }
                   throw error;
                 });
    } else {
      return Promise.reject('Error, not connected');
    }
  }
}
