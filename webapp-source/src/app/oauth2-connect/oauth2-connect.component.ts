import { Component, OnInit, Input } from '@angular/core';
import { CookieService } from 'angular2-cookie/core';
import { Router } from '@angular/router';
import { Headers, Http, RequestOptions, URLSearchParams } from '@angular/http';

import { Oauth2ConnectObservable } from './oauth2-connect.service';

@Component({
  selector: 'my-oauth2-connect',
  template:
`<div #contentWrap><ng-content></ng-content></div>
<div *ngIf="contentWrap.childNodes.length === 0">
  <button type="button" *ngIf="accessToken" (click)="logOut()" title="log out">
    <i class="fa fa-sign-out" aria-hidden="true"></i>
  </button>
  <button type="button" *ngIf="!accessToken" (click)="signIn()" title="log in">
    <i class="fa fa-sign-in" aria-hidden="true"></i>
  </button>
</div>`
})

export class Oauth2ConnectComponent implements OnInit {
  @Input() serverUri: string;
  @Input() clientId: string;
  @Input() responseType: string;
  @Input() redirectUri: string;
  @Input() scope: string;
  @Input() authorizePath: string;
  @Input() tokenPath?: string;
  @Input() storage?: string;

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
    this.router.events.subscribe((route) => {
      let parsedUrl = this.router.parseUrl(route.url);
      let fragmentParams = this.getQueryParams(parsedUrl.fragment);
      if (this.responseType === 'token' && fragmentParams['access_token']) {
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
        } else {
          // this.signIn();
        }
      }
      this.runTokenTimeout();
    });
  }

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
            this.oauth2ConnectObservable.setToken(this.accessToken);
            this.refreshToken = result.json().refresh_token;
            this.setStorage(this.refreshToken);
            this.expiresIn = result.json().expires_in;
            this.oauth2ConnectObservable.setStatus('connected');
            this.runTokenTimeout();
            this.code = '';
          })
          .catch(() => {
            this.code = '';
          });
    }
  }

  getStorage(): string {
    if (this.storage === 'localStorage') {
      return localStorage.getItem('oauth2-token');
    } else if (this.storage === 'cookie') {
      return this.cookieService.get('oauth2-token');
    } else {
      return null;
    }
  }

  setStorage(token: string) {
    if (this.storage === 'localStorage') {
      localStorage.setItem('oauth2-token', token);
    } else if (this.storage === 'cookie') {
      this.cookieService.put('oauth2-token', token);
    }
  }

  removeStorage() {
    if (this.storage === 'localStorage') {
      localStorage.removeItem('oauth2-token');
    } else if (this.storage === 'cookie') {
      this.cookieService.remove('oauth2-token');
    }
  }

  signIn() {
    let redirectUri = this.serverUri + this.authorizePath +
                      '?response_type=' + this.responseType +
                      '&client_id=' + this.clientId +
                      '&redirect_uri=' + encodeURIComponent(this.redirectUri) +
                      '&scope=' + this.scope;
    document.location.href = redirectUri;
  }

  logOut() {
    this.signOut();
    this.removeStorage();
  }

  signOut() {
    this.accessToken = '';
    this.refreshToken = '';
    this.expiresIn = 0;
    clearTimeout(this.timer);
    this.oauth2ConnectObservable.setStatus('disconnected');
  }
}
