import { Component, isDevMode } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
import { Observable } from 'rxjs/Observable';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { ToastrService } from 'toastr-ng2';

import { HutchCryptoService } from '../shared/hutch-crypto.service';
import { HutchCoinService } from '../shared/hutch-coin.service';
import { HutchSafeService } from '../shared/hutch-safe.service';

declare function zxcvbn(password: string, user_inputs?: Array<string>): any;

import * as _ from 'lodash';

export interface ChangeSafeKeyModel {
  safeName: string;
  description: string;
  key: string;
  safeKey?: any;
}
@Component({
    selector: 'my-hutch-message',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                   <div class='modal-header'>
                     <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                     <h4 class='modal-title' [innerHtml]='"modal_change_safe_key_title" | translate'></h4>
                   </div>
                   <div class='modal-body'>
                     <p class='bg-info' [innerHtml]='"modal_change_safe_key_message" | translate'></p>
                     <hr>
                     <div class='row'>
                       <div class='col-md-6'>
                         <label for='currentPassword'
                                [innerHtml]='"modal_manage_safe_password_safe_label" | translate'></label>
                       </div>
                       <div class='col-md-6'>
                         <input type='password'
                                class='form-control'
                                [placeholder]='"modal_manage_safe_export_key_password_input" | translate'
                                name='currentPassword'
                                id='currentPassword'
                                [(ngModel)]='currentPassword'
                                (ngModelChange)='checkCurrentPassword()'>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-12'>
                         <h5 [innerHtml]='"modal_manage_safe_export_safe_key_password_error" | translate'
                             *ngIf='currentPasswordError'
                             class='bg-error'></h5>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-6'>
                         <label for='newPassword' [innerHtml]='"modal_safe_new_password" | translate'></label>
                       </div>
                       <div class='col-md-6'>
                         <input type='password'
                                class='form-control'
                                [placeholder]='"modal_safe_new_password" | translate'
                                name='newPassword'
                                id='newPassword'
                                [disabled]='!currentPassword || currentPasswordError'
                                [(ngModel)]="newPassword"
                                (ngModelChange)='checkPasswordStrength()'>
                       </div>
                     </div>
                     <div class='row' *ngIf='newPassword'>
                       <div class='col-md-6'>
                         <label [innerHtml]='"modal_safe_password_strength" | translate'></label>
                       </div>
                       <div class='col-md-6'>
                         <div class='label label-info' [innerHtml]='passwordStrengthLabel()'></div>
                         <div class='progress'>
                           <div class='progress-bar progress-bar-success'
                                [ngClass]='{ "progress-bar-danger": passwordStrength <= 1,\
                                             "progress-bar-warning": passwordStrength === 2,\
                                             "progress-bar-info": passwordStrength === 3,\
                                             "progress-bar-success": passwordStrength === 4 }'
                                role='progressbar'
                                [attr.aria-valuenow]='passwordStrengthWidth'
                                attr.aria-valuemin='0'
                                attr.aria-valuemax='4'
                                style='width: 100%;'
                                [style.width]='passwordStrengthWidth + "%"'>
                           </div>
                         </div>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-6'>
                         <label for='confirmPassword' [innerHtml]='"modal_safe_new_password_confirm" | translate'></label>
                       </div>
                       <div class='col-md-6'>
                         <input type='password'
                                class='form-control'
                                [placeholder]='"modal_safe_new_password_confirm" | translate'
                                name='confirmPassword'
                                id='confirmPassword'
                                [disabled]='!currentPassword || currentPasswordError'
                                [(ngModel)]="confirmPassword">
                       </div>
                     </div>
                     <hr>
                   </div>
                   <div class='modal-footer'>
                     <button type='button' (click)='changeSafeKey()' class='btn btn-default' [disabled]='!isChangeSafeKeyValid()'>
                       <i class="fa fa-refresh" aria-hidden="true"></i>
                       <span [innerHtml]="'button_change' | translate"></span>
                     </button>
                     <button type='button'
                             class='btn btn-default'
                             (click)='close()'
                             [title]='"button_cancel" | translate'
                             [innerHtml]='"button_close" | translate'>
                     </button>
                   </div>
                 </div>
                 <a id='downloadAnchor' style='display:none'></a>
              </div>`
})
export class ChangeSafeKeyComponent extends DialogComponent<ChangeSafeKeyModel, ChangeSafeKeyModel> implements ChangeSafeKeyModel {
  safeName: string;
  description: string;
  key: string;
  safeKey: any;
  newKey: string;
  currentSafekey: any;
  newSafeKey: any;

  currentPasswordError = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordStrength = 0;
  passwordStrengthWidth = '';

  constructor(dialogService: DialogService,
              private translate: TranslateService,
              private hutchCryptoService: HutchCryptoService,
              private hutchSafeService: HutchSafeService,
              private hutchCoinService: HutchCoinService,
              private toastrService: ToastrService) {
    super(dialogService);
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }

  checkCurrentPassword() {
    this.currentPasswordError = false;
    if (this.currentPassword) {
      this.hutchCryptoService.getKeyFromPassword(this.currentPassword)
      .then((passwordKey) => {
        this.hutchCryptoService.decryptData(this.key, passwordKey)
        .then((exportedKey) => {
          this.hutchCryptoService.getKeyFromExport(exportedKey)
          .then((safeKey) => {
            this.currentSafekey = safeKey;
          })
          .catch((error) => {
            if (isDevMode()) {
              console.log('Hutch debug', error);
            }
          });
        })
        .catch(() => {
          this.currentPasswordError = true;
        });
      })
      .catch((error) => {
        if (isDevMode()) {
          console.log('Hutch debug', error);
        }
      });
    }
  }

  changeSafeKey() {
    this.hutchCryptoService.getKeyFromPassword(this.newPassword)
    .then((passwordKey) => {
      // Generate an export of a random key for the safe
      this.hutchCryptoService.generateSafeKey()
      .then((generatedKey) => {
        this.newSafeKey = generatedKey.key;
        this.hutchCryptoService.encryptData(generatedKey.exportKey, passwordKey)
        .then((encryptedSafeKey) => {
          this.newKey = encryptedSafeKey;
          this.hutchCoinService.list(this.safeName).then((coinList) => {
            // Decrypt each coin
            let coinListDecrypted = [];
            let coinListDecryptedPromises = [];
            _.each((coinList), (encryptedCoin) => {
              coinListDecryptedPromises.push(this.hutchCryptoService.decryptData(encryptedCoin.data, this.currentSafekey)
              .then((decryptedCoin) => {
                coinListDecrypted.push({ name: encryptedCoin.name, data: decryptedCoin });
              }));
            });
            Observable.forkJoin(coinListDecryptedPromises).subscribe(() => {
              // Reencrypt all coins with the new key
              let coinListReencrypted = [];
              let coinListReencryptedPromises = [];
              _.each((coinListDecrypted), (coin) => {
                coinListReencryptedPromises.push(this.hutchCryptoService.encryptData(coin.data, this.newSafeKey)
                .then((encrypytedCoin) => {
                  let charsAvailable = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                  let array = new Uint32Array(128);
                  window.crypto.getRandomValues(array);
                  let name = '';

                  for (let i = 0; i < array.length; i++) {
                    name += charsAvailable[array[i] % charsAvailable.length];
                  }
                  coinListReencrypted.push({ name: name, data: encrypytedCoin });
                }));
              });
              Observable.forkJoin(coinListReencryptedPromises).subscribe(() => {
                // Update safe key in database
                this.hutchSafeService.set(this.safeName, { description: this.description, key: this.newKey })
                .then(() => {
                  // Add new coins
                  let promises = [];
                  _.each(coinListReencrypted, (newCoin) => {
                    promises.push(this.hutchCoinService.add(this.safeName, newCoin));
                  });
                  Observable.forkJoin(promises).subscribe(() => {
                    // Delete old coins
                    let deletePromises = [];
                    _.each(coinList, (coin) => {
                      deletePromises.push(this.hutchCoinService.delete(this.safeName, coin.name));
                    });
                    Observable.forkJoin(deletePromises).subscribe(() => {
                      this.result = { safeName: this.safeName, description: this.description, key: this.key, safeKey: this.newSafeKey };
                      this.toastrService.success(this.translate.instant('toaster_safe_key_changed'),
                                                 this.translate.instant('toaster_title'));
                      this.currentPassword = '';
                      this.newPassword = '';
                      this.confirmPassword = '';
                      this.close();
                    });
                  });
                });
              });
            });
          });
        })
        .catch((error) => {
          this.toastrService.error(this.translate.instant('toaster_error_safe_key_change'), this.translate.instant('toaster_title'));
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
        });
      })
      .catch((error) => {
        this.toastrService.error(this.translate.instant('toaster_error_safe_key_change'), this.translate.instant('toaster_title'));
        if (isDevMode()) {
          console.log('Hutch debug', error);
        }
      });
    })
    .catch((error) => {
      this.toastrService.error(this.translate.instant('toaster_error_safe_key_change'), this.translate.instant('toaster_title'));
      if (isDevMode()) {
        console.log('Hutch debug', error);
      }
    });
  }

  isChangeSafeKeyValid() {
    return this.newPassword.length > 8 &&
           this.newPassword === this.confirmPassword &&
           this.newPassword !== this.currentPassword &&
           this.currentPassword &&
           !this.currentPasswordError;
  }

  checkPasswordStrength() {
    this.passwordStrengthWidth = '';
    if (this.newPassword.length > 8) {
      let result = zxcvbn(this.newPassword);
      this.passwordStrength = result.score;
      this.passwordStrengthWidth = ( this.passwordStrength + 1 ) * 20 + '';
    } else {
      this.passwordStrengthWidth = '20';
      this.passwordStrength = 0;
    }
  }

  passwordStrengthLabel() {
    switch (this.passwordStrength) {
      case 0:
        return this.translate.instant('modal_safe_password_strength_forbidden');
      case 1:
        return this.translate.instant('modal_safe_password_strength_weak');
      case 2:
        return this.translate.instant('modal_safe_password_strength_low');
      case 3:
        return this.translate.instant('modal_safe_password_strength_medium');
      case 4:
        return this.translate.instant('modal_safe_password_strength_hard');
      default:
        return '';
    }
  }
}
