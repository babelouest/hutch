import { Component, OnInit } from '@angular/core';
import { DialogService } from 'ng2-bootstrap-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';

import { MessageComponent } from '../modal/message.component';
import { EditSafeComponent } from '../modal/edit-safe.component';
import { EditProfileComponent } from '../modal/edit-profile.component';

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
  // To avoid compilator warning
  oauth: any = false;
  curLang: string;
  langs: any;

  constructor(private dialogService: DialogService,
              private translate: TranslateService,
              private hutchProfileService: HutchProfileService,
              private hutchSafeService: HutchSafeService,
              private hutchStoreService: HutchObserveService,
              private oauth2Connect: Oauth2ConnectObservable,
              private config: HutchConfigService) {
    this.config.get().then(curConfig => {
      this.translate.setDefaultLang(curConfig.lang.default);
      this.curLang = curConfig.lang.default;
      this.langs = curConfig.lang.available;
      this.oauth = curConfig.oauth2Connect;
    });
  }

  ngOnInit() {
    this.loadProfile();
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
      this.hutchProfileService.getProfile().then((result) => {
        this.profile = result;
        this.hutchStoreService.add('profile', 'profile', this.profile);
        this.loading = false;
      })
      .catch((error) => {
        if (error.status === 404) {
          this.noProfile = true;
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
        this.hutchSafeService.add({name: result.name, description: result.description, key: result.key }).then(() => {
          this.hutchStoreService.add('safe', result.name, {name: result.name, description: result.description, key: result.key });
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

  changeLang() {
    this.translate.use(this.curLang);
  }

  lockAll() {
    let self = this;
    _.each(this.hutchStoreService.getAll('safe'), function (curSafe) {
      delete curSafe.safeKey;
      delete curSafe.coinList;
      localStorage.removeItem(curSafe.name);
      self.hutchStoreService.set('safe', curSafe.name, curSafe);
    });
  }

}
