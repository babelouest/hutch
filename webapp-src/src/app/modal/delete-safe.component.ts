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
import { Component } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
import { HutchCryptoService } from '../shared/hutch-crypto.service';

export interface DeleteSafeModel {
  name: string;
  key: string;
}
@Component({
    selector: 'my-hutch-delete-safe',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                   <div class='modal-header'>
                     <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                     <h4 class='modal-title' [innerHtml]='"modal_delete_safe_title" | translate'></h4>
                   </div>
                   <div class='modal-body'>
                     <p [innerHtml]='"modal_delete_safe_message" | translate:{name: name}'></p>
                     <hr>
                     <div class='row'>
                       <div class='col-md-6'>
                         <label [innerHtml]='"modal_manage_safe_password_label" | translate'></label>
                       </div>
                       <div class='col-md-6'>
                         <input type='password'
                                class='form-control'
                                name='currentPassword'
                                [(ngModel)]='currentPassword'
                                (ngModelChange)='checkPassword()'
                                [placeholder]='"placeholder_password" | translate'>
                       </div>
                     </div>
                   </div>
                   <div class='modal-footer'>
                     <button type='button'
                             class='btn btn-default'
                             (click)='confirm()'
                             [disabled]='!passwordValid'
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
export class DeleteSafeComponent extends DialogComponent<DeleteSafeModel, boolean> implements DeleteSafeModel {
  name: string;
  key: string;
  currentPassword = '';
  passwordValid = false;

  constructor(dialogService: DialogService, private hutchCryptoService: HutchCryptoService) {
    super(dialogService);
  }

  checkPassword() {
    this.passwordValid = false;
    if (this.currentPassword) {
      this.hutchCryptoService.getKeyFromPassword(this.currentPassword)
      .then((passwordKey) => {
        this.hutchCryptoService.decryptData(this.key, passwordKey)
        .then(() => {
          this.passwordValid = true;
        })
        .catch(() => {
          this.passwordValid = false;
        });
      })
      .catch(() => {
      });
    };
  }

  confirm() {
    // we set dialog result as true on click on confirm button,
    // then we can get dialog result from caller code
    this.result = true;
    this.close();
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }
}
