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
