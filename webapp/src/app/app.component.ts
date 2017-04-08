import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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
  oauth: any = false;

  constructor(private hutchSafeService: HutchSafeService,
              private hutchCoinService: HutchCoinService,
              private hutchStoreService: HutchObserveService,
              private hutchCryptoService: HutchCryptoService,
              private oauth2Connect: Oauth2ConnectObservable,
              private router: Router,
              private config: HutchConfigService) {
    this.config.get().then(curConfig => {
      this.oauth = curConfig.oauth2Connect;
    });
  }

  ngOnInit() {
    this.oauth2Connect.getStatus().subscribe((status) => {
      if (status === 'connected') {
        this.hutchSafeService.list().then((result) => {
          for (let safe of result) {
            safe.coinList = [];
            this.hutchStoreService.add('safe', safe.name, safe);
            if (localStorage.getItem('hutch-safe-' + safe.name)) {
              try {
                this.hutchCryptoService.getKeyFromExport(JSON.parse(localStorage.getItem('hutch-safe-' + safe.name))).then((safeKey) => {
                  safe.safeKey = safeKey;
                  this.hutchCoinService.list(safe.name).then((encryptedCoinList) => {
                    if (encryptedCoinList.length > 0) {
                      encryptedCoinList.forEach((encryptedCoin) => {
                        this.hutchCryptoService.decryptData(encryptedCoin.data, safe.safeKey).then((decryptedCoin) => {
                          decryptedCoin.name = encryptedCoin.name;
                          safe.coinList.push(decryptedCoin);
                        });
                      });
                    }
                  });
                });
              } catch (e) {
                localStorage.removeItem('hutch-safe-' + safe.name);
              }
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
}
