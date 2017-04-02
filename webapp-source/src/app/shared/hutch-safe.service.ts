import { Injectable }    from '@angular/core';

import { HutchApiService } from './hutch-api.service';

import 'rxjs/add/operator/toPromise';

import { Safe } from './safe';

@Injectable()
export class HutchSafeService {

  constructor(private hutchApiService: HutchApiService) { }

  list(): Promise<Safe[]> {
    return this.hutchApiService.httpRequest('GET', '/safe/');
  }

  get(name: string): Promise<Safe> {
    return this.hutchApiService.httpRequest('GET', '/safe/' + name);
  }

  add(safe: Safe): Promise<void> {
    return this.hutchApiService.httpRequest('POST', '/safe', null, safe);
  }

  set(safe: Safe): Promise<void> {
    return this.hutchApiService.httpRequest('PUT', '/safe', null, safe);
  }

  delete(name: string): Promise<void> {
    return this.hutchApiService.httpRequest('DELETE', '/safe/' + name);
  }
}
