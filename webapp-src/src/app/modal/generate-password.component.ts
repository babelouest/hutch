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
export interface GeneratePasswordModel {
}
@Component({
    selector: 'my-hutch-generate-password',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                   <div class='modal-header'>
                     <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                     <h4 class='modal-title' [innerHtml]='"modal_password_title" | translate'></h4>
                   </div>
                   <div class='modal-body'>
                     <h5 [innerHtml]='"modal_password_message" | translate'></h5>
                     <div class='row'>
                      <div class='col-md-6'>
                        <label [innerHtml]='"modal_password_low_case" | translate'></label>
                      </div>
                      <div class='col-md-6'>
                        <input type='checkbox' class='form-control' [(ngModel)]='options.letterLowerCase' >
                      </div>
                     </div>
                     <div class='row'>
                      <div class='col-md-6'>
                        <label [innerHtml]='"modal_password_upper_case" | translate'></label>
                      </div>
                      <div class='col-md-6'>
                        <input type='checkbox' class='form-control' [(ngModel)]='options.letterUpperCase' >
                      </div>
                     </div>
                     <div class='row'>
                      <div class='col-md-6'>
                        <label [innerHtml]='"modal_password_numbers" | translate'></label>
                      </div>
                      <div class='col-md-6'>
                        <input type='checkbox' class='form-control' [(ngModel)]='options.numbers' >
                      </div>
                     </div>
                     <div class='row'>
                      <div class='col-md-6'>
                        <label [innerHtml]='"modal_password_spaces" | translate'></label>
                      </div>
                      <div class='col-md-6'>
                        <input type='checkbox' class='form-control' [(ngModel)]='options.spaces' >
                      </div>
                     </div>
                     <div class='row'>
                      <div class='col-md-6'>
                        <label [innerHtml]='"modal_password_special_characters" | translate'></label>
                      </div>
                      <div class='col-md-6'>
                        <input type='checkbox' class='form-control' [(ngModel)]='options.specialChars' >
                      </div>
                     </div>
                     <div class='row'>
                      <div class='col-md-6'>
                        <label [innerHtml]='"modal_password_length" | translate'></label>
                      </div>
                      <div class='col-md-6'>
                        <input type='number' step='1' min='1' class='form-control' [(ngModel)]='options.length' >
                      </div>
                     </div>
                     <div class='row' *ngIf='generatedPassword'>
                      <div class='col-md-12'>
                        <h5 class='label label-success' [innerHtml]='"modal_password_generated" | translate'></h5>
                      </div>
                     </div>
                   </div>
                   <div class='modal-footer'>
                     <button type='button'
                             class='btn btn-default'
                             (click)='generate()'
                             [title]='"button_generate" | translate'
                             [innerHtml]='"button_generate" | translate'>
                     </button>
                     <button type='button'
                             class='btn btn-default'
                             (click)='confirm()'
                             [disabled]='!generatedPassword'
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
export class GeneratePasswordComponent extends DialogComponent<GeneratePasswordModel, string> implements GeneratePasswordModel {
  options = {
    letterLowerCase: true,
    letterUpperCase: true,
    numbers: true,
    specialChars: true,
    spaces: true,
    length: 32
  };
  lettersLowerCaseAvailable = 'abcdefghijklmnopqrstuvwxyz';
  lettersUpperCaseAvailable = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  numbersAvailable = '0123456789';
  specialCharsAvailable = '!"#$%&\'()*+,-./:;<=>?@[\]^_`{|}~';
  spaces = ' ';
  generatedPassword = '';

  constructor(dialogService: DialogService) {
    super(dialogService);
  }

  generate() {
    this.generatedPassword = '';
    let allCharsAvailable = '';
    if (this.options.letterLowerCase) {
      allCharsAvailable += this.lettersLowerCaseAvailable;
    }
    if (this.options.letterUpperCase) {
      allCharsAvailable += this.lettersUpperCaseAvailable;
    }
    if (this.options.numbers) {
      allCharsAvailable += this.numbersAvailable;
    }
    if (this.options.specialChars) {
      allCharsAvailable += this.specialCharsAvailable;
    }
    if (this.options.spaces) {
      allCharsAvailable += this.spaces;
    }
    let array = new Uint32Array(this.options.length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < array.length; i++) {
      this.generatedPassword += allCharsAvailable[array[i] % allCharsAvailable.length];
    }
  }

  confirm() {
    let copyElement = document.createElement('input');
    document.body.appendChild(copyElement);
    copyElement.setAttribute('id', 'copy_element_id');
    let copyDOMElement = document.getElementById('copy_element_id') as HTMLInputElement;
    copyDOMElement.value = this.generatedPassword;
    copyElement.select();
    document.execCommand('copy');
    document.body.removeChild(copyElement);
    this.result = this.generatedPassword;
    this.close();
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }
}
