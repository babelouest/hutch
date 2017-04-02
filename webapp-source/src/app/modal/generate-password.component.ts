import { Component } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
export interface GeneratePasswordModel {
}
@Component({
    selector: 'my-hutch-generate-password',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                   <div class='modal-header'>
                     <button type='button' class='close' (click)='close()'>&times;</button>
                     <h4 class='modal-title'>Generate a new password</h4>
                   </div>
                   <div class='modal-body'>
                     <h5>Generate a random password based on your input parameters:</h5>
                     <div class='row'>
                      <div class='col-xs-6'>
                        <label>Letters lower case</label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='checkbox' class='form-control' [(ngModel)]='options.letterLowerCase' >
                      </div>
                     </div>
                     <div class='row'>
                      <div class='col-xs-6'>
                        <label>Letters upper case</label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='checkbox' class='form-control' [(ngModel)]='options.letterUpperCase' >
                      </div>
                     </div>
                     <div class='row'>
                      <div class='col-xs-6'>
                        <label>Numbers</label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='checkbox' class='form-control' [(ngModel)]='options.numbers' >
                      </div>
                     </div>
                     <div class='row'>
                      <div class='col-xs-6'>
                        <label>Special characters (!, ", #, $, %, &, etc)</label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='checkbox' class='form-control' [(ngModel)]='options.specialChars' >
                      </div>
                     </div>
                     <div class='row'>
                      <div class='col-xs-6'>
                        <label>Length</label>
                      </div>
                      <div class='col-xs-6'>
                        <input type='number' step='1' min='1' class='form-control' [(ngModel)]='options.length' >
                      </div>
                     </div>
                     <div class='row' *ngIf='generatedPassword'>
                      <div class='col-xs-12'>
                        <h5 class='label label-success'>Password generated</h5>
                      </div>
                     </div>
                   </div>
                   <div class='modal-footer'>
                     <button type='button' class='btn btn-default' (click)='generate()'>Generate</button>
                     <button type='button' class='btn btn-default' (click)='confirm()' [disabled]='!generatedPassword'>OK</button>
                     <button type='button' class='btn btn-default' (click)='close()' >Cancel</button>
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
    length: 32
  };
  lettersLowerCaseAvailable = 'abcdefghijklmnopqrstuvwxyz';
  lettersUpperCaseAvailable = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  numbersAvailable = '0123456789';
  specialCharsAvailable = ' !"#$%&\'()*+,-./:;<=>?@[\]^_`{|}~';
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
    let array = new Uint32Array(this.options.length);
    window.crypto.getRandomValues(array);

    for (let i = 0; i < array.length; i++) {
      this.generatedPassword += allCharsAvailable[array[i] % allCharsAvailable.length];
    }
  }

  confirm() {
    this.result = this.generatedPassword;
    this.close();
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }
}
