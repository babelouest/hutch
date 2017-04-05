import { Component, OnInit } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';

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
                       <div class='col-xs-12'>
                         <h4 [innerHtml]='"modal_reset_password_safe_impossible" | translate' class='bg-warning'></h4>
                       </div>
                     </div>
                     <div class='row' *ngIf="!keyFileValid">
                       <div class='col-xs-12'>
                         <h4 [innerHtml]='"modal_reset_password_safe_file_incorrect" | translate' class='bg-error'></h4>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-xs-12'>
                          <span [innerHtml]='"modal_reset_password_upload_file" | translate'></span>
                          <input type='file'
                                 id='localFile'
                                 (change)="fileChange($event)"
                                  [placeholder]='"modal_reset_password_upload_file" | translate'
                                 accept=".bin"
                                 [disabled]="!resetAvailable"/>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-xs-6'>
                         <label for='newPassword' [innerHtml]='"modal_safe_new_password" | translate'></label>
                       </div>
                       <div class='col-xs-6'>
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
                       <div class='col-xs-6'>
                         <label for='confirmNewPassword' [innerHtml]='"modal_safe_new_password_confirm" | translate'></label>
                       </div>
                       <div class='col-xs-6'>
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
                       <div class='col-xs-12'>
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
              private hutchCoinService: HutchCoinService) {
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
            self.hutchCryptoService.decryptData(self.coinList[0].data, safeKey).then(() => {
              self.safeKey = safeKey;
              self.keyFileValid = true;
              self.resetPossible = true;
            })
            .catch(() => {
              self.keyFileValid = false;
              self.resetPossible = false;
            });
          })
          .catch(() => {
            self.keyFileValid = false;
            self.resetPossible = false;
          });
        } catch (e) {
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
    this.hutchCryptoService.getKeyFromPassword(this.newPassword).then((passwordKey) => {
      window.crypto.subtle.exportKey('jwk', this.safeKey).then((exportedKey) => {
        this.hutchCryptoService.encryptData(exportedKey, passwordKey).then((encryptedSafeKey) => {
          this.hutchSafeService.set(this.safeName, { description: this.description, key: encryptedSafeKey })
              .then(() => {
                this.result = encryptedSafeKey;
                this.close();
              });
        });
      });
    });
  }
}
