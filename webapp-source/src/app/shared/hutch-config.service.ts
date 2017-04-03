import { Injectable }    from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class HutchConfigService {
  private config: any = false;

  constructor(private http: Http) {
  }

  get(): Promise<any> {
    if (!this.config) {
      return this.http.get('config.json')
                 .toPromise()
                 .then((result) => {
                   this.config = result.json();
                   return this.config;
                 });
    } else {
      return new Promise(resolve => {
        resolve(this.config);
      });
    }
  }
}
