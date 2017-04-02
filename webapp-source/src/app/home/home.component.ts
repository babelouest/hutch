import { Component, OnInit } from '@angular/core';
import { DialogService } from 'ng2-bootstrap-modal';

import { EditSafeComponent } from '../modal/edit-safe.component';
import { EditProfileComponent } from '../modal/edit-profile.component';

import { HutchProfileService } from '../shared/hutch-profile.service';
import { HutchSafeService } from '../shared/hutch-safe.service';
import { HutchObserveService } from '../shared/hutch-observe.service';

import { Oauth2ConnectObservable } from '../oauth2-connect/oauth2-connect.service';

@Component({
  selector: 'my-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  profile = { fortune: '', picture: '' };
  loading = true;

  constructor(private dialogService: DialogService,
              private hutchProfileService: HutchProfileService,
              private hutchSafeService: HutchSafeService,
              private hutchStoreService: HutchObserveService,
              private oauth2Connect: Oauth2ConnectObservable) {
  }

  ngOnInit() {
    this.loadProfile();
    this.oauth2Connect.getStatus().subscribe((status) => {
      if (status === 'connected') {
        this.loadProfile();
      } else if (status === 'disconnected') {
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
      .catch(() => {
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
          this.profile.fortune = result.fortune;
          this.profile.picture = result.picture;
        });
      }
    });
  }
}
