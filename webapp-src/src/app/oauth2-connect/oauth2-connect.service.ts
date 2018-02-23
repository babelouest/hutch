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
import { ReplaySubject } from 'rxjs/ReplaySubject';

@Injectable()
export class Oauth2ConnectObservable {
  token = new ReplaySubject<string>(1);
  status = new ReplaySubject<string>(1);

  constructor() {
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
