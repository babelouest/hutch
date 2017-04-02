import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { HutchSafeService } from './shared/hutch-safe.service';
import { HutchObserveService } from './shared/hutch-observe.service';
import { HutchCryptoService } from './shared/hutch-crypto.service';

import '../style/app.scss';

import * as _ from 'lodash';

@Component({
  selector: 'my-hutch-app', // <my-hutch-app></my-hutch-app>
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  url = 'https://github.com/babelouest/hutch';
  title: string;
  safeList = [];
  homeActive = true;

  constructor(private hutchSafeService: HutchSafeService,
              private hutchStoreService: HutchObserveService,
              private hutchCryptoService: HutchCryptoService,
              private router: Router) {
  }

  ngOnInit() {
    this.hutchSafeService.list().then((result) => {
      for (let safe of result) {
        if (localStorage.getItem(safe.name)) {
          try {
            this.hutchCryptoService.getKeyFromExport(JSON.parse(localStorage.getItem(safe.name))).then((safeKey) => {
              safe.safeKey = safeKey;
            });
          } catch (e) {
            localStorage.removeItem(safe.name);
          }
        }
        this.hutchStoreService.add('safe', safe.name, safe);
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
        } else {
          _.remove(this.safeList, {name: event.name});
        }
      });
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
}
