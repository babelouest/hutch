import { Injectable }    from '@angular/core';
import { Headers, Http, RequestOptions, URLSearchParams } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class HutchApiService {
  // TODO: Add OAuth2 authentication header
  private headers = new Headers({
'Content-Type': 'application/json',

'Authorization': 'Bearer '
});

  // TODO: Use config service
  private hutcApiBasehUrl = '';

  constructor(private http: Http) { }

  httpRequest(method: string, url: string, search?: Map<string, string[]>, data?: any): Promise<any> {
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
               .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }
}
