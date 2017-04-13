import { Component, OnInit, isDevMode } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { DialogService } from 'ng2-bootstrap-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { Observable } from 'rxjs/Observable';
import { ToastrService } from 'toastr-ng2';

import { Safe } from '../shared/safe';

import { ConfirmComponent } from '../modal/confirm.component';
import { EditSafeComponent } from '../modal/edit-safe.component';
import { ManageSafeComponent } from '../modal/manage-safe.component';
import { ResetPasswordSafeComponent } from '../modal/reset-password-safe.component';
import { ChangeSafeKeyComponent } from '../modal/change-safe-key.component';

import { HutchObserveService } from '../shared/hutch-observe.service';
import { HutchSafeService } from '../shared/hutch-safe.service';
import { HutchCoinService } from '../shared/hutch-coin.service';
import { HutchCryptoService } from '../shared/hutch-crypto.service';

import * as _ from 'lodash';

@Component({
  selector: 'my-hutch-safe',
  templateUrl: './safe.component.html'
})

export class SafeComponent implements OnInit {
  safe: Safe;
  safeName = '';
  searchValue: string;
  loading = false;

  coinList = [];
  coinListDisplayed = [];

  unlocked = false;
  passwordError = false;
  keepSafeOpen = false;
  safePassword = '';
  errorMessage = '';
  safeFound = true;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private translate: TranslateService,
              private toastrService: ToastrService,
              private dialogService: DialogService,
              private hutchStoreService: HutchObserveService,
              private hutchCryptoService: HutchCryptoService,
              private hutchSafeService: HutchSafeService,
              private hutchCoinService: HutchCoinService) {
    this.safe = {name: '', description: '', key: '', safeKey: null, coinList: []};
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.safeName = params['name'];
      this.searchValue = '';
      this.safePassword = '';
      this.passwordError = false;
      this.keepSafeOpen = false;
      this.loadSafe();
    });
    if (this.safe.name) {
      this.hutchStoreService.getObservable('safe').subscribe((status) => {
        if ((this.safe && status.action === 'add' || this.safe && status.action === 'set') && status.name === this.safeName) {
          this.loadSafe();
        } else if (this.safe && (status.action === 'clear' || (status.action === 'delete' && status.name === this.safeName))) {
          this.lockSafe();
        }
      });
    } else {
      this.router.navigate(['']);
    }
  }

  searchCoin() {
    if (this.searchValue !== '') {
      this.coinListDisplayed = [];
      for (let curCoin of this.coinList) {
        if (curCoin.displayName.toLowerCase().indexOf(this.searchValue.toLowerCase()) >= 0) {
          this.coinListDisplayed.push(curCoin);
        }
      }
    } else {
      this.coinListDisplayed = this.coinList.slice();
    }
  }

  editSafe() {
    this.dialogService.addDialog(EditSafeComponent, {
      isNew: false,
      name: this.safe.name,
      description: this.safe.description,
      key: this.safe.key
    })
    .subscribe((result) => {
      if (result) {
        this.hutchSafeService.set(this.safe.name, { description: result.description, key: result.key })
        .then(() => {
          this.safe.name = result.name;
          this.safe.description = result.description;
          this.safe.key = result.key;
          this.hutchStoreService.set('safe', this.safe.name, this.safe);
        })
        .catch((error) => {
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
          this.toastrService.error(this.translate.instant('toaster_error_safe_save'), this.translate.instant('toaster_title'));
        });
      }
    });
  }

  deleteSafe() {
    this.dialogService.addDialog(ConfirmComponent, {
      title: this.translate.instant('safe_delete_safe'),
      message: this.translate.instant('safe_delete_safe_confirm', { name: this.safe.name })})
      .subscribe((result) => {
        if (result) {
          this.hutchSafeService.delete(this.safe.name)
          .then(() => {
            this.hutchStoreService.delete('safe', this.safe.name);
            this.router.navigate(['']);
          })
          .catch((error) => {
            if (isDevMode()) {
              console.log('Hutch debug', error);
            }
            this.toastrService.error(this.translate.instant('toaster_error_safe_delete'), this.translate.instant('toaster_title'));
          });
        }
      });
  }

  addCoin() {
    let charsAvailable = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let array = new Uint32Array(128);
    window.crypto.getRandomValues(array);
    let name = '';

    for (let i = 0; i < array.length; i++) {
      name += charsAvailable[array[i] % charsAvailable.length];
    }
    let newCoin = {
      editCoinMode: true,
      name: name,
      data: '',
      rows: [],
      displayName: this.translate.instant('safe_new_coin')
    };

    // Save new coin in the coin list
    let saveCoin = {
      displayName: newCoin.displayName,
      rows: newCoin.rows
    };
    this.hutchCryptoService.encryptData(saveCoin, this.safe.safeKey)
    .then((encryptedCoin) => {
      this.hutchCoinService.add(this.safe.name, { name: newCoin.name, data: encryptedCoin })
      .then(() => {
        this.coinList.unshift(newCoin);
        this.coinListDisplayed.unshift(newCoin);
        this.toastrService.success(this.translate.instant('toaster_success_coin_save'), this.translate.instant('toaster_title'));
      })
      .catch((error) => {
        if (isDevMode()) {
          console.log('Hutch debug', error);
        }
        this.toastrService.error(this.translate.instant('toaster_error_coin_save'), this.translate.instant('toaster_title'));
      });
    })
    .catch((error) => {
      if (isDevMode()) {
        console.log('Hutch debug', error);
      }
    });
  }

  loadSafe() {
    this.safe = {name: '', description: '', key: '', safeKey: null, coinList: []};
    this.coinList = [];
    this.coinListDisplayed = [];
    if (this.hutchStoreService.get('safe', this.safeName)) {
      this.safe = this.hutchStoreService.get('safe', this.safeName);
      if (!!this.safe.safeKey) {
        this.unlocked = true;
        this.coinList = this.safe.coinList || [];
        this.coinListDisplayed = this.safe.coinList.slice();
      } else {
        this.unlocked = false;
        this.coinList = [];
        this.coinListDisplayed = [];
      }
    } else {
      this.safeFound = false;
    }
  }

  checkPassword() {
    this.passwordError = false;
    this.hutchCryptoService.getKeyFromPassword(this.safePassword)
    .then((passwordKey) => {
      this.hutchCryptoService.decryptData(this.safe.key, passwordKey)
      .then((exportedKey) => {
        this.hutchCryptoService.getKeyFromExport(exportedKey)
        .then((safeKey) => {
          this.safe.safeKey = safeKey;
          this.hutchStoreService.set('safe', this.safe.name, this.safe);
          this.unlocked = true;
          this.loadCoins();
          if (this.keepSafeOpen) {
            localStorage.setItem('hutch-safe-' + this.safe.name, JSON.stringify(exportedKey));
          }
          this.safePassword = '';
          this.keepSafeOpen = false;
        })
        .catch((error) => {
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
          this.passwordError = true;
          this.unlocked = false;
        });
      })
      .catch(() => {
        this.passwordError = true;
        this.unlocked = false;
      });
    })
    .catch((error) => {
      if (isDevMode()) {
        console.log('Hutch debug', error);
      }
      this.passwordError = true;
      this.unlocked = false;
    });
  }

  loadCoins() {
    this.loading = true;
    this.searchValue = '';
    this.safe.coinList = [];
    this.hutchCoinService.list(this.safe.name)
    .then((result) => {
      let promises = [];
      result.forEach((encryptedCoin) => {
        promises.push(this.hutchCryptoService.decryptData(encryptedCoin.data, this.safe.safeKey)
        .then((decryptedCoin) => {
          decryptedCoin.name = encryptedCoin.name;
          this.safe.coinList.push(decryptedCoin);
        })
        .catch((error) => {
          this.toastrService.error(this.translate.instant('toaster_error_coin_list'), this.translate.instant('toaster_title'));
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
        }));
      });
      if (promises.length > 0) {
        Observable.forkJoin(promises).subscribe(() => {
          this.hutchStoreService.set('safe', this.safe.name, this.safe);
          this.coinListDisplayed = this.safe.coinList.slice();
          this.loading = false;
        });
      } else {
        this.loading = false;
      }
    })
    .catch((error) => {
      this.toastrService.error(this.translate.instant('toaster_error_coin_list'), this.translate.instant('toaster_title'));
      if (isDevMode()) {
        console.log('Hutch debug', error);
      }
    });
  }

  refreshSafe() {
    if (this.safe && this.safe.safeKey) {
      this.loadCoins();
    }
  }

  lockSafe() {
    delete this.safe.safeKey;
    delete this.safe.coinList;
    this.safe.coinList = [];
    localStorage.removeItem('hutch-safe-' + this.safe.name);
    this.coinList = [];
    this.coinListDisplayed = [];
    this.unlocked = false;
    if (this.hutchStoreService.get('safe', this.safe.name)) {
      this.hutchStoreService.set('safe', this.safe.name, this.safe);
    }
  }

  deleteCoin(coin) {
    _.remove(this.coinList, {name: coin.name});
    _.remove(this.coinListDisplayed, {name: coin.name});
  }

  manageSafe() {
    this.dialogService.addDialog(ManageSafeComponent, {
      safeName: this.safe.name,
      safeKey: this.safe.safeKey,
      key: this.safe.key,
      coinList: this.coinList
    })
    .subscribe((result) => {
      if (result) {
        this.refreshSafe();
      }
    });
  }

  forgotPassword(event) {
    event.preventDefault();
    this.dialogService.addDialog(ResetPasswordSafeComponent, {
      safeName: this.safe.name,
      description: this.safe.description,
      key: this.safe.key
    })
    .subscribe((result) => {
      if (result) {
        this.safe.key = result;
      }
    });
  }

  changeSafeKey() {
    this.dialogService.addDialog(ChangeSafeKeyComponent, {
      safeName: this.safe.name,
      description: this.safe.description,
      key: this.safe.key
    })
    .subscribe((result) => {
      if (result) {
        console.log(result);
        this.safe.key = result.key;
        this.safe.safeKey = result.safeKey;
        this.hutchStoreService.set('safe', this.safe.name, this.safe);
        this.refreshSafe();
        if (localStorage.getItem('hutch-safe-' + this.safe.name)) {
          localStorage.setItem('hutch-safe-' + this.safe.name, JSON.stringify(result.exportKey));
        }
      }
    });
  }
}
