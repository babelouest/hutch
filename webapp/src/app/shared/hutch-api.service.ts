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
      this.headers.set('Authorization', 'Bearer ' + token);
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
                   return error;
                 });
    } else {
      return Promise.reject('Error, not connected');
    }
  }
}
