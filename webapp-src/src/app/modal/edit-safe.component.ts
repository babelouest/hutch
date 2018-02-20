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
import { Component, isDevMode } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { ToastrService } from 'ngx-toastr';

import { HutchCryptoService } from '../shared/hutch-crypto.service';
import { HutchObserveService } from '../shared/hutch-observe.service';

declare function zxcvbn(password: string, user_inputs?: Array<string>): any;

export interface EditSafeModel {
  isNew: boolean;
  name: string;
  description: string;
  key: string;
  safeKey?: any;
}
@Component({
    selector: 'my-hutch-confirm',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                  <form (ngSubmit)='confirm()'>
                    <div class='modal-header'>
                      <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                      <h4 class='modal-title' [innerHtml]='(isNew ? "modal_safe_add" : "modal_safe_edit" ) | translate'></h4>
                    </div>
                    <div class='modal-body'>
                      <h5 [innerHtml]='"modal_safe_set_parameters" | translate'></h5>
                      <div class='row'>
                        <div class='col-md-6'>
                          <label [innerHtml]='"modal_safe_name" | translate'></label>
                        </div>
                        <div class='col-md-6'>
                          <input type='text'
                                 class='form-control'
                                 [disabled]="!isNew"
                                 name='name'
                                 [(ngModel)]='name'
                                 [placeholder]='"modal_safe_name" | translate'>
                        </div>
                      </div>
                      <div class='row'>
                        <div class='col-md-6'>
                          <label [innerHtml]='"modal_safe_description" | translate'></label>
                        </div>
                        <div class='col-md-6'>
                          <input type='text'
                                 class='form-control'
                                 name='description'
                                 [(ngModel)]='description'
                                 [placeholder]='"modal_safe_description" | translate'>
                        </div>
                      </div>
                      <hr>
                      <div class='row' *ngIf='!isNew'>
                        <div class='col-md-6'>
                          <label [innerHtml]='"modal_safe_current_password" | translate'></label>
                        </div>
                        <div class='col-md-6'>
                          <input type='password'
                                 class='form-control'
                                 name='currentPassword'
                                 [(ngModel)]='currentPassword'
                                 [placeholder]='"modal_safe_current_password_placeholder" | translate'>
                        </div>
                      </div>
                      <div class='row'>
                        <div class='col-md-6'>
                          <label [innerHtml]='"modal_safe_new_password" | translate'></label>
                        </div>
                        <div class='col-md-6'>
                          <input type='password'
                                 class='form-control'
                                 name='password'
                                 [(ngModel)]='password'
                                 (ngModelChange)='checkPasswordStrength()'
                                 [placeholder]='"modal_safe_new_password" | translate'>
                        </div>
                      </div>
                      <div class='row'>
                        <div class='col-md-6'>
                          <label [innerHtml]='"modal_safe_password_strength" | translate'></label>
                        </div>
                        <div class='col-md-6'>
                          <div class='label label-info' [innerHtml]='passwordStrengthLabel()'></div>
                          <div class='progress'>
                            <div class='progress-bar progress-bar-success'
                                 [ngClass]='{ "progress-bar-danger": strength <= 1,\
                                              "progress-bar-warning": strength === 2,\
                                              "progress-bar-info": strength === 3,\
                                              "progress-bar-success": strength === 4 }'
                                 role='progressbar'
                                 [attr.aria-valuenow]='strengthWidth'
                                 attr.aria-valuemin='0'
                                 attr.aria-valuemax='4'
                                 style='width: 100%;'
                                 [style.width]='strengthWidth + "%"'>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class='row'>
                        <div class='col-md-6'>
                          <label [innerHtml]='"modal_safe_new_password_confirm" | translate'></label>
                        </div>
                        <div class='col-md-6'>
                          <input type='password'
                                 class='form-control'
                                 name='confirmPassword'
                                 [(ngModel)]='confirmPassword'
                                 [placeholder]='"modal_safe_new_password_confirm" | translate'>
                        </div>
                      </div>
                      <div class='row' style="margin-top: 10px;">
                        <div class='col-md-12'>
                          <p class='bg-warning' [innerHtml]='"modal_safe_password_warning" | translate'></p>
                        </div>
                      </div>
                      <div class='row' *ngIf='error'>
                        <div class='col-md-12 text-center'>
                          <label class='label label-danger' [innerHtml]='"modal_safe_error" | translate'></label>
                        </div>
                      </div>
                    </div>
                    <div class='modal-footer'>
                      <button type='submit'
                              class='btn btn-default'
                              [disabled]='!isValid()'
                              [title]='"button_ok" | translate'
                              [innerHtml]='"button_ok" | translate'>
                      </button>
                      <button type='button'
                              class='btn btn-default'
                              (click)='close()'
                              [title]='"button_cancel" | translate'
                              [innerHtml]='"button_cancel" | translate'>
                      </button>
                    </div>
                  </form>
               </div>
            </div>`
})
export class EditSafeComponent extends DialogComponent<EditSafeModel, EditSafeModel> implements EditSafeModel {
  title: string;
  error = false;

  isNew: boolean;
  name: string;
  description: string;
  key: string;
  safeKey?: any;

  currentPassword: string;
  password: string;
  confirmPassword: string;
  strength: number;
  strengthWidth: string;

  constructor(dialogService: DialogService,
              private translate: TranslateService,
              private hutchCryptoService: HutchCryptoService,
              private hutchStoreService: HutchObserveService,
              private toastrService: ToastrService) {
    super(dialogService);
  }

  confirm() {
    this.error = false;
    if (this.isNew) {
      // Generate key from password
      this.hutchCryptoService.getKeyFromPassword(this.password)
      .then((passwordKey) => {
        // Generate an export of a random key for the safe
        this.hutchCryptoService.generateSafeKey()
        .then((result) => {
          this.hutchCryptoService.encryptData(result.exportKey, passwordKey)
          .then((encryptedSafeKey) => {
            this.key = encryptedSafeKey;
            this.result = {
              isNew: this.isNew,
              name: this.name,
              description: this.description,
              key: this.key,
              safeKey: result.key
            };
            this.close();
          })
          .catch((error) => {
            this.toastrService.error(this.translate.instant('toaster_error_safe_create'), this.translate.instant('toaster_title'));
            if (isDevMode()) {
              console.log('Hutch debug', error);
            }
          });
        })
        .catch((error) => {
          this.toastrService.error(this.translate.instant('toaster_error_safe_create'), this.translate.instant('toaster_title'));
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
        });
      })
      .catch((error) => {
        this.toastrService.error(this.translate.instant('toaster_error_safe_create'), this.translate.instant('toaster_title'));
        if (isDevMode()) {
          console.log('Hutch debug', error);
        }
        this.error = true;
      });
    } else {
      if (this.currentPassword) {
        this.hutchCryptoService.getKeyFromPassword(this.currentPassword)
        .then((passwordKey) => {
          this.hutchCryptoService.decryptData(this.key, passwordKey)
          .then((exportedKey) => {
            // Regenerate key from new password
            this.hutchCryptoService.getKeyFromPassword(this.password)
            .then((newPasswordKey) => {
              this.hutchCryptoService.encryptData(exportedKey, newPasswordKey)
              .then((encryptedSafeKey) => {
                this.key = encryptedSafeKey;
                this.result = {isNew: this.isNew, name: this.name, description: this.description, key: this.key};
                this.close();
              })
              .catch((error) => {
                this.toastrService.error(this.translate.instant('toaster_error_safe_create'), this.translate.instant('toaster_title'));
                if (isDevMode()) {
                  console.log('Hutch debug', error);
                }
              });
            })
            .catch((error) => {
              this.toastrService.error(this.translate.instant('toaster_error_safe_create'), this.translate.instant('toaster_title'));
              if (isDevMode()) {
                console.log('Hutch debug', error);
              }
              this.error = true;
            });
          })
          .catch((error) => {
            this.toastrService.error(this.translate.instant('toaster_error_safe_create'), this.translate.instant('toaster_title'));
            if (isDevMode()) {
              console.log('Hutch debug', error);
            }
            this.error = true;
          });
        })
        .catch((error) => {
          this.toastrService.error(this.translate.instant('toaster_error_safe_create'), this.translate.instant('toaster_title'));
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
        });
      } else {
        this.result = {isNew: this.isNew, name: this.name, description: this.description, key: this.key};
        this.close();
      }
    }
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }

  isValid() {
    if (this.isNew) {
      if (this.hutchStoreService.get('safe', this.name)) {
        return false;
      }
      return this.name &&
             this.password &&
             this.password.length >= 8 &&
             this.password === this.confirmPassword;
    } else {
      return this.name &&
             (!this.password && !this.confirmPassword) ||
             (this.password && this.password.length >= 8 && this.password === this.confirmPassword);
    }
  }

  checkPasswordStrength() {
    this.strengthWidth = '';
    if (this.password.length > 8) {
      let result = zxcvbn(this.password);
      this.strength = result.score;
      this.strengthWidth = ( this.strength + 1 ) * 20 + '';
    } else {
      this.strengthWidth = '20';
      this.strength = 0;
    }
  }

  passwordStrengthLabel() {
    switch (this.strength) {
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
