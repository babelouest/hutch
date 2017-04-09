import { Component, isDevMode } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
import { Observable } from 'rxjs/Observable';

import { HutchCryptoService } from '../shared/hutch-crypto.service';
import { HutchCoinService } from '../shared/hutch-coin.service';

import * as _ from 'lodash';

export interface ManageSafeModel {
  safeName: string;
  key: string;
  safeKey: any;
  coinList: any[];
}
@Component({
    selector: 'my-hutch-message',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                   <div class='modal-header'>
                     <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                     <h4 class='modal-title' [innerHtml]='"modal_manage_safe_title" | translate'></h4>
                   </div>
                   <div class='modal-body'>
                     <p class='bg-info' [innerHtml]='"modal_manage_safe_message" | translate'></p>
                     <hr>
                     <div class='row'>
                       <div class='col-md-12'>
                         <h4 [innerHtml]='"modal_manage_safe_export_coins" | translate'></h4>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-12'>
                         <label for="exportWithPassword" class="checkbox-inline">
                           <input type="checkbox" [(ngModel)]="exportWithPassword" name="exportWithPassword" id="exportWithPassword">
                           <span [innerHtml]="'modal_manage_safe_export_coins_with_password' | translate"></span>
                         </label>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-6'>
                         <label for='exportPassword' [innerHtml]='"modal_manage_safe_password_label" | translate'></label>
                       </div>
                       <div class='col-md-6'>
                         <input type='password'
                                class='form-control'
                                [placeholder]='"modal_manage_safe_export_coins_password_input" | translate'
                                name='exportPassword'
                                id='exportPassword'
                                [(ngModel)]="exportPassword"
                                [disabled]='!exportWithPassword'>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-12'>
                         <button type='button' (click)='exportCoins()' class='btn btn-default' [disabled]='!isExportValid()'>
                           <i class="fa fa-cloud-download" aria-hidden="true"></i>
                           <span [innerHtml]="'button_export' | translate"></span>
                         </button>
                       </div>
                     </div>
                     <hr>
                     <div class='row'>
                       <div class='col-md-12'>
                         <h4 [innerHtml]='"modal_manage_safe_import_coins" | translate'></h4>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-12'>
                          <span [innerHtml]='"modal_manage_safe_import_file" | translate'></span>
                          <input type='file'
                                 id='localFile'
                                 (change)="fileChange($event)"
                                  [placeholder]='"modal_manage_safe_import_file_placeholder" | translate'
                                 accept=".json,.bin" />
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-6'>
                         <label for='importPassword' [innerHtml]='"modal_manage_safe_password_label" | translate'></label>
                       </div>
                       <div class='col-md-6 form-group has-feedback'>
                         <input type='password'
                                class='form-control'
                                [placeholder]='"modal_manage_safe_import_coins_password_input" | translate'
                                name='importPassword'
                                id='importPassword'
                                [(ngModel)]="importPassword"
                                [disabled]='!doesImportNeedPassword'
                                (ngModelChange)="checkImportPassword()">
                         <i class="fa fa-check form-control-feedback"
                            aria-hidden="true"
                            *ngIf="importPasswordValid"
                            style="color:green"></i>
                         <i class="fa fa-times form-control-feedback"
                            aria-hidden="true"
                            *ngIf="!importPasswordValid"
                            style="color:red"></i>
                         <i class="fa fa-cog fa-spin form-control-feedback"
                            aria-hidden="true"
                            *ngIf="importPasswordChecking"
                            style="color:red"></i>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-12'>
                         <button type='button' (click)='importCoins()' class='btn btn-default' [disabled]='!isImportValid()'>
                           <i class="fa fa-cloud-upload" aria-hidden="true"></i>
                           <span [innerHtml]="'button_import' | translate"></span>
                         </button>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-12'>
                         <h5 [innerHtml]='"modal_manage_safe_import_success" | translate'
                             *ngIf='importMessage === "success"'
                             class='bg-success'></h5>
                         <h5 [innerHtml]='"modal_manage_safe_import_error" | translate'
                             *ngIf='importMessage === "error"'
                             class='bg-error'></h5>
                         <h5 [innerHtml]='"modal_manage_safe_import_data_error" | translate'
                             *ngIf='importMessage === "error-data"'
                             class='bg-error'></h5>
                       </div>
                     </div>
                     <hr>
                     <div class='row'>
                       <div class='col-md-12'>
                         <h4 [innerHtml]='"modal_manage_safe_export_key" | translate'></h4>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-6'>
                         <label for='exportSafeKeyPassword' [innerHtml]='"modal_manage_safe_password_safe_label" | translate'></label>
                       </div>
                       <div class='col-md-6'>
                         <input type='password'
                                class='form-control'
                                [placeholder]='"modal_manage_safe_export_key_password_input" | translate'
                                name='exportSafeKeyPassword'
                                id='exportSafeKeyPassword'
                                [(ngModel)]="exportSafeKeyPassword">
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-12'>
                         <h5 [innerHtml]='"modal_manage_safe_export_safe_key_password_error" | translate'
                             *ngIf='exportSafeKeyMessage === "password-error"'
                             class='bg-error'></h5>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-12'>
                         <button type='button' (click)='exportSafeKey()' class='btn btn-default' [disabled]='!exportSafeKeyPassword'>
                           <i class="fa fa-cloud-download" aria-hidden="true"></i>
                           <span [innerHtml]="'button_export' | translate"></span>
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
                 <a id='downloadAnchor' style='display:none'></a>
              </div>`
})
export class ManageSafeComponent extends DialogComponent<ManageSafeModel, boolean> implements ManageSafeModel {
  safeName: string;
  key: string;
  safeKey: any;
  coinList = [];

  exportWithPassword = false;
  exportPassword = '';
  importWithPassword = false;
  importPassword = '';
  importPasswordValid = false;
  importPasswordChecking = false;
  doesImportNeedPassword = false;
  importFileContent = '';
  shouldRefreshCoinList = false;
  importedCoinList: any;
  importMessage = '';
  exportSafeKeyPassword = '';
  exportSafeKeyMessage = '';

  constructor(dialogService: DialogService,
              private hutchCryptoService: HutchCryptoService,
              private hutchCoinService: HutchCoinService) {
    super(dialogService);
  }

  close() {
    // Avoid annoying warning message, nothing less
    this.result = this.shouldRefreshCoinList;
    super.close();
  }

  isExportValid() {
    return !this.exportWithPassword || (this.exportPassword.length > 0);
  }

  exportCoins() {
    let fileData = '';
    let downloadAnchor = document.getElementById('downloadAnchor');
    if (this.exportWithPassword) {
      // Generate key from password
      this.hutchCryptoService.getKeyFromPassword(this.exportPassword)
      .then((passwordKey) => {
        this.hutchCryptoService.encryptData(this.coinList, passwordKey)
        .then((encryptedCoins) => {
          fileData = 'data:application/octet-stream,' + encryptedCoins;
          downloadAnchor.setAttribute('href', fileData);
          downloadAnchor.setAttribute('download', this.safeName + '.bin');
          downloadAnchor.click();
        })
        .catch((error) => {
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
        });
      })
      .catch((error) => {
        if (isDevMode()) {
          console.log('Hutch debug', error);
        }
      });
    } else {
      fileData = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.coinList));
      downloadAnchor.setAttribute('href', fileData);
      downloadAnchor.setAttribute('download', this.safeName + '.json');
      downloadAnchor.click();
    }
  }

  fileChange(event) {
    this.importPasswordValid = false;
    let self = this;
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      let fr = new FileReader();
      fr.onload = function(ev2: any) {
        self.importFileContent = ev2.target.result;
        try {
          self.importedCoinList = JSON.parse(self.importFileContent);
          self.importPasswordValid = (self.importedCoinList instanceof Array);
        } catch (e) {
          // Looks like import file is not a json, needs to be decrypted
          self.doesImportNeedPassword = true;
        }
      };
      fr.readAsText(file);
    }
  }

  checkImportPassword() {
    if (this.importPassword) {
      this.importPasswordChecking = true;
      this.hutchCryptoService.getKeyFromPassword(this.importPassword)
      .then((key) => {
        this.hutchCryptoService.decryptData(this.importFileContent, key)
        .then((decryptedData) => {
          this.importPasswordValid = true;
          this.importPasswordChecking = false;
          this.importedCoinList = decryptedData;
          if (!(this.importedCoinList instanceof Array)) {
            this.importMessage = 'error-data';
          } else {
            this.importMessage = '';
          }
        })
        .catch(() => {
          this.importPasswordValid = false;
          this.importPasswordChecking = false;
        });
      })
      .catch((error) => {
        if (isDevMode()) {
          console.log('Hutch debug', error);
        }
      });
    } else {
      return false;
    }
  }

  isImportValid() {
    return this.importFileContent && (!this.doesImportNeedPassword || this.importPasswordValid);
  }

  importCoins() {
    this.importMessage = '';
    let promises = [];
    _.each(this.importedCoinList, (newCoin) => {
      let charsAvailable = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let array = new Uint32Array(128);
      window.crypto.getRandomValues(array);
      newCoin.name = '';

      for (let i = 0; i < array.length; i++) {
        newCoin.name += charsAvailable[array[i] % charsAvailable.length];
      }
      promises.push(this.hutchCryptoService.encryptData(newCoin, this.safeKey)
      .then((encryptedCoin) => {
        this.hutchCoinService.add(this.safeName, { name: newCoin.name, data: encryptedCoin })
        .then(() => {
        })
        .catch(() => {
          this.importMessage = 'error';
        });
      })
      .catch((error) => {
        if (isDevMode()) {
          console.log('Hutch debug', error);
        }
      }));
    });
    Observable.forkJoin(promises).subscribe(() => {
      this.importMessage = 'success';
    });
    this.shouldRefreshCoinList = true;
  }

  exportSafeKey() {
    this.exportSafeKeyMessage = '';
    this.hutchCryptoService.getKeyFromPassword(this.exportSafeKeyPassword)
    .then((passwordKey) => {
      this.hutchCryptoService.decryptData(this.key, passwordKey)
      .then((exportedKey) => {
        this.hutchCryptoService.getKeyFromExport(exportedKey, true)
        .then((safeKey) => {
          window.crypto.subtle.exportKey('jwk', safeKey)
          .then((key) => {
            let fileData = 'data:application/octet-stream,' +
                            this.hutchCryptoService.arrayBufferToBase64(
                              this.hutchCryptoService.convertStringToArrayBufferView(
                                JSON.stringify(key)
                              )
                            );
            let downloadAnchor = document.getElementById('downloadAnchor');
            downloadAnchor.setAttribute('href', fileData);
            downloadAnchor.setAttribute('download', this.safeName + '-safekey.bin');
            downloadAnchor.click();
          }, (error) => {
            if (isDevMode()) {
              console.log('Hutch debug', error);
            }
          });
        })
        .catch((error) => {
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
        });
      })
      .catch((error) => {
        if (isDevMode()) {
          console.log('Hutch debug', error);
        }
        this.exportSafeKeyMessage = 'password-error';
      });
    })
    .catch((error) => {
      if (isDevMode()) {
        console.log('Hutch debug', error);
      }
    });
  }
}
