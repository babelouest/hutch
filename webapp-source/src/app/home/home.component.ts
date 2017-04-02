import { Component, OnInit } from '@angular/core';
import { DialogService } from 'ng2-bootstrap-modal';

import { EditSafeComponent } from '../modal/edit-safe.component';
import { EditProfileComponent } from '../modal/edit-profile.component';

import { HutchProfileService } from '../shared/hutch-profile.service';
import { HutchSafeService } from '../shared/hutch-safe.service';
import { HutchObserveService } from '../shared/hutch-observe.service';

@Component({
  selector: 'my-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  fortune = '';
  picture = '';
  loading = true;

  constructor(private dialogService: DialogService,
              private hutchProfileService: HutchProfileService,
              private hutchSafeService: HutchSafeService,
              private hutchStoreService: HutchObserveService) {
  }

  ngOnInit() {
    this.hutchProfileService.getProfile().then((result) => {
      this.fortune = result.fortune;
      this.picture = result.picture;
      this.loading = false;
    });
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
      fortune: this.fortune,
      picture: this.picture
    })
    .subscribe((result) => {
      if (result) {
        this.hutchProfileService.setProfile({fortune: result.fortune, picture: result.picture})
        .then(() => {
          this.fortune = result.fortune;
          this.picture = result.picture;
        });
      }
    });
  }
}
