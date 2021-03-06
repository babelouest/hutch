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
import { Component, OnInit, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'angular2-cookie/core';
import { DialogService } from 'ng2-bootstrap-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { ToastrService } from 'ngx-toastr';

import { MessageComponent } from '../modal/message.component';
import { EditSafeComponent } from '../modal/edit-safe.component';
import { EditProfileComponent } from '../modal/edit-profile.component';
import { HistoryComponent } from '../modal/history.component';

import { HutchProfileService } from '../shared/hutch-profile.service';
import { HutchSafeService } from '../shared/hutch-safe.service';
import { HutchObserveService } from '../shared/hutch-observe.service';
import { HutchConfigService } from '../shared/hutch-config.service';

import { Oauth2ConnectObservable } from '../oauth2-connect/oauth2-connect.service';

import * as _ from 'lodash';

@Component({
  selector: 'my-home',
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  profile = { fortune: '', picture: '' };
  loading = true;
  noProfile = false;
  connected = false;
  curLang: string;
  langs: any;

  constructor(private dialogService: DialogService,
              private translate: TranslateService,
              private router: Router,
              private cookieService: CookieService,
              private toastrService: ToastrService,
              private hutchProfileService: HutchProfileService,
              private hutchSafeService: HutchSafeService,
              private hutchStoreService: HutchObserveService,
              private oauth2Connect: Oauth2ConnectObservable,
              private config: HutchConfigService) {
    this.config.get().then(curConfig => {
      this.langs = curConfig.lang.available;
      this.translate.setDefaultLang(curConfig.lang.default);
      this.curLang = this.getCurrentLang(this.langs, curConfig.lang.default);
      this.translate.use(this.curLang);
    });
  }

  getCurrentLang(langsAvailable: any[], defaultLang: string): string {
    // First check hutchStoreService
    // Else check the url for a lang=xx parameter
    // Else check the cookies
    // Else check browser
    // Else get config default
    let lang = '';
    if (this.hutchStoreService.get('profile', 'lang')) {
      lang = this.hutchStoreService.get('profile', 'lang');
    } else {
      let params = this.router.parseUrl(this.router.url);
      if (params['lang']) {
        lang = params['lang'];
        this.hutchStoreService.add('profile', 'lang', lang);
        this.cookieService.put('lang', lang);
        this.router.navigate(['']);
      } else if (this.cookieService.get('lang')) {
        lang = this.cookieService.get('lang');
        this.hutchStoreService.add('profile', 'lang', lang);
      } else if (this.translate.getBrowserCultureLang() && _.find(langsAvailable, {code: this.translate.getBrowserCultureLang()})) {
        lang = this.translate.getBrowserCultureLang();
      } else {
        lang = defaultLang;
        this.hutchStoreService.add('profile', 'lang', lang);
        this.cookieService.put('lang', lang);
      }
    }
    return lang;
  }

  changeLang() {
    this.translate.use(this.curLang);
    this.hutchStoreService.add('profile', 'lang', this.curLang);
    this.cookieService.put('lang', this.curLang);
  }

  ngOnInit() {
    this.oauth2Connect.getStatus().subscribe((status) => {
      if (status === 'connected') {
        this.connected = true;
        this.loadProfile();
      } else if (status === 'disconnected') {
        this.connected = false;
        this.profile = { fortune: '', picture: '' };
        this.hutchStoreService.delete('profile', 'profile');
      }
    });
  }

  loadProfile() {
    if (!this.hutchStoreService.get('profile', 'profile')) {
      this.hutchProfileService.getProfile()
      .then((result) => {
        this.profile = result;
        this.hutchStoreService.add('profile', 'profile', this.profile);
        this.loading = false;
      })
      .catch((error) => {
        if (error.status === 404) {
          this.noProfile = true;
        } else {
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
          this.toastrService.error(this.translate.instant('toaster_error_load_profile'), this.translate.instant('toaster_title'));
        }
        this.loading = false;
      });
    } else {
      this.profile = this.hutchStoreService.get('profile', 'profile');
      this.loading = false;
    }
  }

  addSafe() {
    this.dialogService.addDialog(EditSafeComponent, {
      isNew: true,
      name: '',
      description: '',
      key: ''
    })
    .subscribe((result) => {
      if (result) {
        this.hutchSafeService.add({name: result.name, description: result.description, key: result.key })
        .then(() => {
          this.hutchStoreService.add('safe',
                                     result.name,
                                     {
                                       name: result.name,
                                       description: result.description,
                                       key: result.key,
                                       coinList: []
                                     }
                                    );
          this.toastrService.success(this.translate.instant('toaster_add_safe_success'), this.translate.instant('toaster_title'));
        })
        .catch((error) => {
          this.toastrService.error(this.translate.instant('toaster_add_safe_error'), this.translate.instant('toaster_title'));
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
        });
      }
    });
  }

  editProfile() {
    this.dialogService.addDialog(EditProfileComponent, {
      fortune: this.profile.fortune,
      picture: this.profile.picture
    })
    .subscribe((result) => {
      if (result) {
        this.hutchProfileService.setProfile({fortune: result.fortune, picture: result.picture})
        .then(() => {
          this.noProfile = false;
          this.profile.fortune = result.fortune;
          this.profile.picture = result.picture;
          this.toastrService.success(this.translate.instant('toaster_set_profile_success'), this.translate.instant('toaster_title'));
        })
        .catch((error) => {
          this.toastrService.error(this.translate.instant('toaster_set_prfile_error'), this.translate.instant('toaster_title'));
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
        });
      }
    });
  }

  showWhyProfileModal(event) {
    event.preventDefault();
    this.dialogService.addDialog(MessageComponent, {
      title: this.translate.instant('modal_why_this_title'),
      message: this.translate.instant('modal_why_this_message')
    });
  }

  lockAll() {
    let self = this;
    _.each(this.hutchStoreService.getAll('safe'), function (curSafe) {
      delete curSafe.safeKey;
      delete curSafe.coinList;
      curSafe.coinList = [];
      localStorage.removeItem('hutch-safe-' + curSafe.name);
      self.hutchStoreService.set('safe', curSafe.name, curSafe);
    });
    this.toastrService.success(this.translate.instant('toaster_lock_all_safe'), this.translate.instant('toaster_title'));
  }

  profileHistory() {
    this.dialogService.addDialog(HistoryComponent, {
      type: 'profile'
    });
  }
}
