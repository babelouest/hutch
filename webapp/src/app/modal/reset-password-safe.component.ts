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
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { ToastrService } from 'toastr-ng2';

import { HutchCryptoService } from '../shared/hutch-crypto.service';
import { HutchSafeService } from '../shared/hutch-safe.service';
import { HutchCoinService } from '../shared/hutch-coin.service';

export interface ResetPasswordSafeModel {
  safeName: string;
  description: string;
  key: any;
}
@Component({
    selector: 'my-hutch-message',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                   <div class='modal-header'>
                     <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                     <h4 class='modal-title' [innerHtml]='"modal_reset_password_safe_title" | translate'></h4>
                   </div>
                   <div class='modal-body'>
                     <p class='bg-info' [innerHtml]='"modal_reset_password_safe_message" | translate'></p>
                     <hr>
                     <div class='row' *ngIf="!resetAvailable">
                       <div class='col-md-12'>
                         <h4 [innerHtml]='"modal_reset_password_safe_impossible" | translate' class='bg-warning'></h4>
                       </div>
                     </div>
                     <div class='row' *ngIf="!keyFileValid">
                       <div class='col-md-12'>
                         <h4 [innerHtml]='"modal_reset_password_safe_file_incorrect" | translate' class='bg-error'></h4>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-12'>
                          <span [innerHtml]='"modal_reset_password_upload_file" | translate'></span>
                          <div class='fileUpload btn btn-default'>
                            <span [innerHtml]='"button_upload" | translate'></span>
                            <input type='file'
                                   name='file'
                                   (change)='fileChange($event)'
                                   accept='.bin'
                                   class='upload'
                                   [disabled]='!resetAvailable'/>
                          </div>
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
                                [(ngModel)]="newPassword"
                                [disabled]='!resetPossible'>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-6'>
                         <label for='confirmNewPassword' [innerHtml]='"modal_safe_new_password_confirm" | translate'></label>
                       </div>
                       <div class='col-md-6'>
                         <input type='password'
                                class='form-control'
                                [placeholder]='"modal_safe_new_password_confirm" | translate'
                                name='confirmNewPassword'
                                id='confirmNewPassword'
                                [(ngModel)]="confirmNewPassword"
                                [disabled]='!resetPossible'>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-12'>
                         <button type='button' (click)='changePassword()' class='btn btn-default' [disabled]='!isNewPasswordValid()'>
                           <i class="fa fa-key" aria-hidden="true"></i>
                           <span [innerHtml]="'button_change_password' | translate"></span>
                         </button>
                       </div>
                     </div>
                   </div>
                   <div class='modal-footer'>
                     <button type='button'
                             class='btn btn-default'
                             (click)='close()'
                             [title]='"button_close" | translate'
                             [innerHtml]='"button_close" | translate'>
                     </button>
                   </div>
                 </div>
              </div>`
})
export class ResetPasswordSafeComponent extends DialogComponent<ResetPasswordSafeModel, string> implements ResetPasswordSafeModel, OnInit {
  safeName: string;
  description: string;
  key: string;

  resetAvailable = false;
  resetPossible = false;
  keyFileValid = true;
  coinList = [];
  safeKey: any = false;
  newPassword = '';
  confirmNewPassword = '';

  constructor(dialogService: DialogService,
              private hutchCryptoService: HutchCryptoService,
              private hutchSafeService: HutchSafeService,
              private hutchCoinService: HutchCoinService,
              private translate: TranslateService,
              private toastrService: ToastrService) {
    super(dialogService);
  }

  ngOnInit() {
    this.hutchCoinService.list(this.safeName).then((list) => {
      this.coinList = list;
      if (list.length > 0) {
        this.resetAvailable = true;
      }
    });
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }

  fileChange(event) {
    this.keyFileValid = true;
    this.resetPossible = false;
    let self = this;
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      let fr = new FileReader();
      fr.onload = function(ev2: any) {
        try {
          self.hutchCryptoService.getKeyFromExport(
            JSON.parse(
              self.hutchCryptoService.convertArrayBufferViewtoString(
                self.hutchCryptoService.base64ToArrayBuffer(
                  ev2.target.result
                )
              )
            ), true
          ).then((safeKey) => {
            self.hutchCryptoService.decryptData(self.coinList[0].data, safeKey)
            .then(() => {
              self.safeKey = safeKey;
              self.keyFileValid = true;
              self.resetPossible = true;
            })
            .catch((error) => {
              if (isDevMode()) {
                console.log('Hutch debug', error);
              }
              self.keyFileValid = false;
              self.resetPossible = false;
            });
          })
          .catch((error) => {
            if (isDevMode()) {
              console.log('Hutch debug', error);
            }
            self.keyFileValid = false;
            self.resetPossible = false;
          });
        } catch (error) {
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
          self.keyFileValid = false;
          self.resetPossible = false;
        }
      };
      fr.readAsText(file);
    }
  }

  isNewPasswordValid() {
    return this.safeKey && this.newPassword === this.confirmNewPassword && this.newPassword.length >= 8;
  }

  changePassword() {
    this.hutchCryptoService.getKeyFromPassword(this.newPassword)
    .then((passwordKey) => {
      window.crypto.subtle.exportKey('jwk', this.safeKey)
      .then((exportedKey) => {
        this.hutchCryptoService.encryptData(exportedKey, passwordKey)
        .then((encryptedSafeKey) => {
          this.hutchSafeService.set(this.safeName, { description: this.description, key: encryptedSafeKey })
          .then(() => {
            this.result = encryptedSafeKey;
            this.close();
          })
          .catch((error) => {
            this.toastrService.error(this.translate.instant('toaster_error_reset_safe_password'), this.translate.instant('toaster_title'));
            if (isDevMode()) {
              console.log('Hutch debug', error);
            }
          });
        })
        .catch((error) => {
          this.toastrService.error(this.translate.instant('toaster_error_reset_safe_password'), this.translate.instant('toaster_title'));
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
        });
      }, (error) => {
        this.toastrService.error(this.translate.instant('toaster_error_reset_safe_password'), this.translate.instant('toaster_title'));
        if (isDevMode()) {
          console.log('Hutch debug', error);
        }
      });
    })
    .catch((error) => {
      this.toastrService.error(this.translate.instant('toaster_error_reset_safe_password'), this.translate.instant('toaster_title'));
      if (isDevMode()) {
        console.log('Hutch debug', error);
      }
    });
  }
}
