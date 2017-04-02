import { Injectable }    from '@angular/core';
import { Headers, Http, RequestOptions, URLSearchParams } from '@angular/http';

import { Oauth2ConnectObservable } from '../oauth2-connect/oauth2-connect.service';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class HutchApiService {
  private headers = new Headers({
    'Content-Type': 'application/json'
  });

  // TODO: Use config service
  private hutcApiBasehUrl = '';

  constructor(private http: Http, private oauth2Connect: Oauth2ConnectObservable) {
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
        url: this.hutcApiBasehUrl + url,
        search: searchParams,
        body: JSON.stringify(data),
        headers: this.headers
      });
      return this.http.request(url, options)
                 .toPromise()
                 .then((result) => {
                   return result.json();
                 });
    } else {
      return Promise.reject('Error, not connected');
    }
  }
}
