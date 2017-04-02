import { Injectable }    from '@angular/core';

import { HutchApiService } from './hutch-api.service';

import 'rxjs/add/operator/toPromise';

import { Coin } from './coin';

@Injectable()
export class HutchCoinService {

  constructor(private hutchApiService: HutchApiService) { }

  list(safe: string): Promise<Coin[]> {
    return this.hutchApiService.httpRequest('GET', '/safe/' + safe + '/coin/')
               .then(function (result) {
                 return result.json();
               });
  }

  get(safe: string, name: string): Promise<Coin> {
    return this.hutchApiService.httpRequest('GET', '/safe/' + safe + '/coin/' + name)
               .then(function (result) {
                 return result.json();
               });
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
