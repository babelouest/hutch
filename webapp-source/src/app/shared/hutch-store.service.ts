import { Injectable }    from '@angular/core';

@Injectable()
export class HutchStoreService {
  private storage: any = {};

  constructor() { }

  add(storeName: string, name: string, data: any) {
    if (!this.storage[storeName]) {
      this.storage[storeName] = {};
    }
    this.storage[storeName][name] = data;
  }

  remove(storeName: string, name: string) {
    if (this.storage[storeName]) {
      delete this.storage[storeName][name];
    }
  }

  get(storeName: string, name: string) {
    if (this.storage[storeName]) {
      return this.storage[storeName][name];
    } else {
      return undefined;
    }
  }

  getAll(storeName: string) {
    return this.storage[storeName];
  }
}
