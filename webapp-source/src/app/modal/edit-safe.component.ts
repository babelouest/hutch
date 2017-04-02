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
                    <button type='button' class='close' (click)='close()'>&times;</button>
                    <h4 class='modal-title'>{{name || 'New safe'}}</h4>
                  </div>
                  <div class='modal-body'>
                    <h5>Set safe parameters</h5>
                    <div class='row'>
                      <div class='col-xs-6'>
                        <label>Name</label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='text' class='form-control' [(ngModel)]='name' placeholder='Name'>
                      </div>
                    </div>
                    <div class='row'>
                      <div class='col-xs-6'>
                        <label>Description</label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='text' class='form-control' [(ngModel)]='description' placeholder='Description'>
                      </div>
                    </div>
                    <div class='row'>
                      <div class='col-xs-6'>
                        <label>New password</label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='password' class='form-control' [(ngModel)]='password' placeholder='New password'>
                      </div>
                    </div>
                    <div class='row'>
                      <div class='col-xs-6'>
                        <label>Confirm new password</label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='password' class='form-control' [(ngModel)]='confirmPassword' placeholder='Confirm new password'>
                      </div>
                    </div>
                    <div class='row' *ngIf='error'>
                      <div class='col-xs-12 text-center'>
                        <label class='label label-danger'>An error has occured</label>
                      </div>
                    </div>
                  </div>
                  <div class='modal-footer'>
                    <button type='button' class='btn btn-default' (click)='confirm()' [disabled]='!isValid()'>OK</button>
                    <button type='button' class='btn btn-default' (click)='close()' >Cancel</button>
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
      this.result = {isNew: this.isNew, name: this.name, description: this.description, key: this.key};
      this.close();
    }
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }

  isValid() {
    return this.name &&
           (!this.password && !this.confirmPassword) ||
           (this.password && this.password.length >= 8 && this.password === this.confirmPassword);
  }

}
