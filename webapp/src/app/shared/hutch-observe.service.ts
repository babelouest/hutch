import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import * as _ from 'lodash';

export class Store {
  name: string;
  observable: ReplaySubject<any>;
  data: any;

  constructor(name: string) {
    this.name = name;
    this.observable = new ReplaySubject();
    this.data = {};
  }
}

export class HutchObserveService {
  private storage: Store[] = [];

  constructor() { }

  add(storeName: string, name: string, data: any) {
    let store = _.find(this.storage, {name: storeName});
    if (!store) {
      store = new Store(storeName);
      this.storage.push(store);
    }
    store.data[name] = data;
    store.observable.next({ action: 'add', name: name });
  }

  set(storeName: string, name: string, data: any) {
    let store = _.find(this.storage, {name: storeName});
    if (store) {
      store.data[name] = data;
      store.observable.next({ action: 'set', name: name });
    }
  }

  delete(storeName: string, name: string) {
    let store = _.find(this.storage, {name: storeName});
    if (store) {
      delete store.data[name];
      store.observable.next({ action: 'delete', name: name });
    }
  }

  get(storeName: string, name: string) {
    let store = _.find(this.storage, {name: storeName});
    if (store) {
      return store.data[name];
    } else {
      return undefined;
    }
  }

  getAll(storeName: string) {
    let store = _.find(this.storage, {name: storeName});
    if (store) {
      return store.data;
    } else {
      return undefined;
    }
  }

  removeAll(storeName: string) {
    let store = _.find(this.storage, {name: storeName});
    if (store) {
      delete store.data;
      store.data = {};
      store.observable.next({ action: 'clear', name: '' });
    }
  }

  getObservable(storeName: string): Observable<any> {
    let store = _.find(this.storage, {name: storeName});
    if (!store) {
      store = new Store(storeName);
      this.storage.push(store);
    }
    return store.observable.asObservable();
  }
}
