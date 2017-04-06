import { Component } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';

import { HutchCryptoService } from '../shared/hutch-crypto.service';

export interface EditSafeModel {
  isNew: boolean;
  name: string;
  description: string;
  key: string;
}
@Component({
    selector: 'my-hutch-confirm',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                  <div class='modal-header'>
                    <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                    <h4 class='modal-title' [innerHtml]='(isNew ? "modal_safe_add" : "modal_safe_edit" ) | translate'></h4>
                  </div>
                  <div class='modal-body'>
                    <h5 [innerHtml]='"modal_safe_set_parameters" | translate'></h5>
                    <div class='row'>
                      <div class='col-xs-6'>
                        <label [innerHtml]='"modal_safe_name" | translate'></label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='text'
                               class='form-control'
                               [disabled]="!isNew"
                               [(ngModel)]='name'
                               [placeholder]='"modal_safe_name" | translate'>
                      </div>
                    </div>
                    <div class='row'>
                      <div class='col-xs-6'>
                        <label [innerHtml]='"modal_safe_description" | translate'></label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='text'
                               class='form-control'
                               [(ngModel)]='description'
                               [placeholder]='"modal_safe_description" | translate'>
                      </div>
                    </div>
                    <hr>
                    <div class='row' *ngIf='!isNew'>
                      <div class='col-xs-6'>
                        <label [innerHtml]='"modal_safe_current_password" | translate'></label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='password'
                               class='form-control'
                               [(ngModel)]='currentPassword'
                               [placeholder]='"modal_safe_current_password_placeholder" | translate'>
                      </div>
                    </div>
                    <div class='row'>
                      <div class='col-xs-6'>
                        <label [innerHtml]='"modal_safe_new_password" | translate'></label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='password'
                               class='form-control'
                               [(ngModel)]='password'
                               [placeholder]='"modal_safe_new_password" | translate'>
                      </div>
                    </div>
                    <div class='row'>
                      <div class='col-xs-6'>
                        <label [innerHtml]='"modal_safe_new_password_confirm" | translate'></label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='password'
                               class='form-control'
                               [(ngModel)]='confirmPassword'
                               [placeholder]='"modal_safe_new_password_confirm" | translate'>
                      </div>
                    </div>
                    <div class='row' style="margin-top: 10px;">
                      <div class='col-xs-12'>
                        <p class='bg-warning' [innerHtml]='"modal_safe_password_warning" | translate'></p>
                      </div>
                    </div>
                    <div class='row' *ngIf='error'>
                      <div class='col-xs-12 text-center'>
                        <label class='label label-danger' [innerHtml]='"modal_safe_error" | translate'></label>
                      </div>
                    </div>
                  </div>
                  <div class='modal-footer'>
                    <button type='button'
                            class='btn btn-default'
                            (click)='confirm()'
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

  currentPassword: string;
  password: string;
  confirmPassword: string;

  constructor(dialogService: DialogService, private hutchCryptoService: HutchCryptoService) {
    super(dialogService);
  }

  confirm() {
    this.error = false;
    if (this.isNew) {
      // Generate key from password
      this.hutchCryptoService.getKeyFromPassword(this.password)
      .then((passwordKey) => {
        // Generate an export of a random key for the safe
        this.hutchCryptoService.generateSafeKey().then((safeKey) => {
          this.hutchCryptoService.encryptData(safeKey, passwordKey)
          .then((encryptedSafeKey) => {
            this.key = encryptedSafeKey;
            this.result = {isNew: this.isNew, name: this.name, description: this.description, key: this.key};
            this.close();
          });
        });
      })
      .catch(() => {
        this.error = true;
      });
    } else {
      if (this.currentPassword) {
        this.hutchCryptoService.getKeyFromPassword(this.currentPassword).then((passwordKey) => {
          this.hutchCryptoService.decryptData(this.key, passwordKey).then((exportedKey) => {
            // Regenerate key from new password
            this.hutchCryptoService.getKeyFromPassword(this.password)
            .then((newPasswordKey) => {
              this.hutchCryptoService.encryptData(exportedKey, newPasswordKey)
              .then((encryptedSafeKey) => {
                this.key = encryptedSafeKey;
                this.result = {isNew: this.isNew, name: this.name, description: this.description, key: this.key};
                this.close();
              });
            })
            .catch(() => {
              this.error = true;
            });
          })
          .catch(() => {
            this.error = true;
          });
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

}
