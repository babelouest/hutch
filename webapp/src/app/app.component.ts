import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TranslateService } from 'ng2-translate';

import { Observable } from 'rxjs/Observable';

import { HutchSafeService } from './shared/hutch-safe.service';
import { HutchCoinService } from './shared/hutch-coin.service';
import { HutchObserveService } from './shared/hutch-observe.service';
import { HutchCryptoService } from './shared/hutch-crypto.service';
import { HutchConfigService } from './shared/hutch-config.service';

import { Oauth2ConnectObservable } from './oauth2-connect/oauth2-connect.service';

import '../style/app.scss';

import * as _ from 'lodash';

@Component({
  selector: 'my-hutch-app', // <my-hutch-app></my-hutch-app>
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title: string;
  safeList = [];
  homeActive = true;
  // To avoid compilator warning
  oauth: any = false;
  curLang: string;
  langs: any;

  constructor(private hutchSafeService: HutchSafeService,
              private hutchCoinService: HutchCoinService,
              private hutchStoreService: HutchObserveService,
              private hutchCryptoService: HutchCryptoService,
              private oauth2Connect: Oauth2ConnectObservable,
              private router: Router,
              private translate: TranslateService,
              private config: HutchConfigService) {
    this.config.get().then(curConfig => {
      this.translate.setDefaultLang(curConfig.lang.default);
      this.curLang = curConfig.lang.default;
      this.langs = curConfig.lang.available;
      this.oauth = curConfig.oauth2Connect;
    });
  }

  changeLang() {
    this.translate.use(this.curLang);
  }

  ngOnInit() {
    this.oauth2Connect.getStatus().subscribe((status) => {
      if (status === 'connected') {
        this.hutchSafeService.list().then((result) => {
          let promises = [];
          for (let safe of result) {
            if (localStorage.getItem(safe.name)) {
              try {
                this.hutchCryptoService.getKeyFromExport(JSON.parse(localStorage.getItem(safe.name))).then((safeKey) => {
                  safe.safeKey = safeKey;
                  this.hutchCoinService.list(safe.name).then((encryptedCoinList) => {
                    safe.coinList = [];
                    encryptedCoinList.forEach((encryptedCoin) => {
                      promises.push(this.hutchCryptoService.decryptData(encryptedCoin.data, safe.safeKey).then((decryptedCoin) => {
                        decryptedCoin.name = encryptedCoin.name;
                        safe.coinList.push(decryptedCoin);
                      }));
                    });
                    Observable.forkJoin(promises).subscribe(() => {
                      this.hutchStoreService.add('safe', safe.name, safe);
                    });
                  })
                  .catch(() => {
                  });
                });
              } catch (e) {
                localStorage.removeItem(safe.name);
              }
            } else {
              this.hutchStoreService.add('safe', safe.name, safe);
            }
          }
          this.safeList = result;
          this.hutchStoreService.getObservable('safe').subscribe((event) => {
            if (event.action === 'add') {
              let index = _.indexOf(this.safeList, _.find(this.safeList, {name: event.name}));
              if (index > -1) {
                this.safeList[index] = this.hutchStoreService.get('safe', event.name);
              } else {
                this.safeList.push(this.hutchStoreService.get('safe', event.name));
              }
            } else if (event.action === 'delete') {
              _.remove(this.safeList, {name: event.name});
            } else if (event.action === 'clear') {
              this.safeList = [];
              this.router.navigate(['']);
              this.selectTab(null, null);
            }
          });
        })
        .catch(() => {
        });
      } else if (status === 'disconnected') {
        this.safeList = [];
        this.router.navigate(['']);
      }
    });
    this.router.events.subscribe((route) => {
      if (!route.url.startsWith('/safe/')) {
        this.selectTab(null, null);
      }
    });
  }

  selectNav(nav) {
    this.safeList.forEach((safe) => {
      safe.active = false;
    });
    nav.active = true;
  }

  selectTab(event, safe) {
    if (event) {
      event.preventDefault();
    }
    this.homeActive = false;
    _.each(this.safeList, function (curSafe) {
      curSafe.active = false;
    });
    if (safe) {
      safe.active = true;
    } else {
      this.homeActive = true;
    }
  }

  lockAll() {
    let self = this;
    _.each(this.safeList, function (curSafe) {
      delete curSafe.safeKey;
      delete curSafe.coinList;
      localStorage.removeItem(curSafe.name);
      self.hutchStoreService.set('safe', curSafe.name, curSafe);
    });
  }
}
