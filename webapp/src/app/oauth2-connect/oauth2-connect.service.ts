/**
 *
 * Oauth2-connect Observable service, to be informed of the status change
 * and of the new access_token
 *
 * Copyright 2017 Nicolas Mora <mail@babelouest.org>
 *
 * Licence: MIT
 *
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class Oauth2ConnectObservable {
  token: Subject<string>;
  status: Subject<string>;

  constructor() {
    this.token = new Subject();
    this.status = new Subject();
  }

  getToken(): Observable<string> {
    return this.token.asObservable();
  }

  setToken(token: string) {
    this.token.next(token);
  }

  getStatus(): Observable<string> {
    return this.status.asObservable();
  }

  setStatus(status: string) {
    this.status.next(status);
  }
}
