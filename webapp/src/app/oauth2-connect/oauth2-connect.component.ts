/**
 *
 * OAuth2-connect
 *
 * Angular 2 component for OAuth2 connection
 *
 * Implements response types implicit and code
 *
 * Copyright 2017 Nicolas Mora <mail@babelouest.org>
 *
 * Licence: MIT
 *
 */
import { Component, OnInit, Input } from '@angular/core';
import { CookieService } from 'angular2-cookie/core';
import { Router } from '@angular/router';
import { Headers, Http, RequestOptions, URLSearchParams } from '@angular/http';

import { Oauth2ConnectObservable } from './oauth2-connect.service';

@Component({
  selector: 'my-oauth2-connect',
  template: `<div #content><ng-content></ng-content></div>
<div *ngIf="content.childNodes.length === 0">
  <button type="button" *ngIf="accessToken" (click)="logOut()" title="log out">
    Log out
  </button>
  <button type="button" *ngIf="!accessToken" (click)="logIn()" title="log in">
    Log in
  </button>
</div>`
})

export class Oauth2ConnectComponent implements OnInit {
  @Input() serverUri: string;      // URL to the OAuth2 server
  @Input() clientId: string;       // client_id to use
  @Input() responseType: string;   // response_type, can be 'code' or 'token'
  @Input() redirectUri: string;    // redirect_uri for the connection
  @Input() scope?: string;         // multiple scopes must be separated by a space
  @Input() authorizePath: string;  // Path to auth url, relative to serverUri
  @Input() tokenPath?: string;     // Path to token url, relative to serverUri, not used if response_type is 'token'
  @Input() storage?: string;       // Storage method to store the refresh_token if response_type is 'code',
                                   // can be 'localStorage' or 'cookie' or null, default is null

  storageName = 'oauth2-token';
  accessToken = '';
  refreshToken = '';
  code = '';
  expiresIn = 0;
  timer = null;

  constructor(private oauth2ConnectObservable: Oauth2ConnectObservable,
              private cookieService: CookieService,
              private router: Router,
              private http: Http) { }

  ngOnInit() {
    this.oauth2ConnectObservable.setStatus('not connected');
    this.parseUrl(this.router.url);
    this.router.events.subscribe((route) => {
      this.parseUrl(route.url);
    });
  }

  parseUrl(url) {
    let parsedUrl = this.router.parseUrl(url);
    let fragmentParams = this.getQueryParams(parsedUrl.fragment);
    if (this.responseType === 'token' && fragmentParams['access_token']) {
      // Get access_token from fragment url
      this.accessToken = fragmentParams['access_token'];
      this.oauth2ConnectObservable.setToken(this.accessToken);
      this.oauth2ConnectObservable.setStatus('connected');
      this.expiresIn = fragmentParams['expires_in'];
      this.runTokenTimeout();
      this.router.navigate(['']);
    } else if (this.responseType === 'code' && parsedUrl.queryParams['code']) {
      // Get refresh_token from code
      this.code = parsedUrl.queryParams['code'];
      this.getRefreshTokenFromCode();
      this.router.navigate(['']);
    } else if (!fragmentParams['error'] && !this.accessToken && !this.code) {
      this.refreshToken = this.getStorage();
      if (this.refreshToken) {
        this.runRefreshToken();
      }
    }
    this.runTokenTimeout();
  }

  /**
   * Parse a parameters string like 'foo=bar&bob=sam' into an object like
   * {
   *   foo: 'bar',
   *   bob: 'sam'
   * }
   */
  getQueryParams(qs) {
    if (qs) {
      qs = qs.split('+').join(' ');

      let params = {},
      tokens,
      re = /[?&]?([^=]+)=([^&]*)/g;

      while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
      }
      return params;
    } else {
      return {};
    }
  }

  /**
   * Run a timeout to disable the access_token when exired
   * and refresh the token if available
   * Expiration is ran 1 minute before expires_in value
   */
  runTokenTimeout() {
    if (this.expiresIn > 0) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.accessToken = '';
        this.expiresIn = 0;
        this.runRefreshToken();
      }, 1000 * (this.expiresIn - 60));
    }
  }

  /**
   * Request a new access_token from on a refresh_token
   */
  runRefreshToken() {
    if (this.refreshToken) {
      let bodyParams = new URLSearchParams();
      bodyParams.append('grant_type', 'refresh_token');
      bodyParams.append('refresh_token', this.refreshToken);
      bodyParams.append('scope', this.scope);

      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });

      let url = this.serverUri + this.tokenPath;

      let options: RequestOptions = new RequestOptions({
        method: 'POST',
        url: url,
        body: bodyParams.toString(),
        headers: headers
      });

      this.http.request(url, options)
          .toPromise()
          .then((result) => {
            let newStatus = 'refresh';
            if (!this.accessToken) {
              newStatus = 'connected';
            }
            this.accessToken = result.json().access_token;
            this.oauth2ConnectObservable.setToken(this.accessToken);
            this.expiresIn = result.json().expires_in;
            this.oauth2ConnectObservable.setStatus(newStatus);
            this.runTokenTimeout();
          })
          .catch(() => {
            this.signOut();
          });
    }
  }

  /**
   * Request a refresh_token from a code
   */
  getRefreshTokenFromCode() {
    if (this.code) {
      let bodyParams = new URLSearchParams();
      bodyParams.append('grant_type', 'authorization_code');
      bodyParams.append('code', this.code);
      bodyParams.append('redirect_uri', this.redirectUri);
      bodyParams.append('client_id', this.clientId);

      let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });

      let url = this.serverUri + this.tokenPath;

      let options: RequestOptions = new RequestOptions({
        method: 'POST',
        url: url,
        body: bodyParams.toString(),
        headers: headers
      });

      this.http.request(url, options)
          .toPromise()
          .then((result) => {
            this.accessToken = result.json().access_token;
            this.expiresIn = result.json().expires_in;
            this.oauth2ConnectObservable.setToken(this.accessToken);
            this.refreshToken = result.json().refresh_token;
            this.setStorage(this.refreshToken);
            this.code = '';
            this.oauth2ConnectObservable.setStatus('connected');
            this.runTokenTimeout();
          })
          .catch(() => {
            this.code = '';
          });
    }
  }

  /**
   * Get the refresh_token from the storage if available
   */
  getStorage(): string {
    if (this.storage === 'localStorage') {
      return localStorage.getItem(this.storageName);
    } else if (this.storage === 'cookie') {
      return this.cookieService.get(this.storageName);
    } else {
      return null;
    }
  }

  /**
   * Set the refresh_token in the storage if available
   */
  setStorage(token: string) {
    if (this.storage === 'localStorage') {
      localStorage.setItem(this.storageName, token);
    } else if (this.storage === 'cookie') {
      this.cookieService.put(this.storageName, token);
    }
  }

  /**
   * Remove the refresh_token from the storage if available
   */
  removeStorage() {
    if (this.storage === 'localStorage') {
      localStorage.removeItem(this.storageName);
    } else if (this.storage === 'cookie') {
      this.cookieService.remove(this.storageName);
    }
  }

  /**
   * Redirect to the connection url with the specified parameters
   */
  logIn() {
    let redirectUri = this.serverUri + this.authorizePath +
                      '?response_type=' + this.responseType +
                      '&client_id=' + this.clientId +
                      '&redirect_uri=' + encodeURIComponent(this.redirectUri);
    if (this.scope) {
      redirectUri += '&scope=' + this.scope;
    }
    document.location.href = redirectUri;
  }

  /**
   * Erase the tokens and clear the storage
   */
  logOut() {
    this.signOut();
    this.removeStorage();
  }

  /**
   * Erase the tokens and send a disconnect signal
   */
  signOut() {
    this.accessToken = '';
    this.refreshToken = '';
    this.expiresIn = 0;
    clearTimeout(this.timer);
    this.oauth2ConnectObservable.setStatus('disconnected');
    this.oauth2ConnectObservable.setToken(this.accessToken);
  }
}
