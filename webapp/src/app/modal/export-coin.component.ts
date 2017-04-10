import { Component, isDevMode } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { ToastrService } from 'toastr-ng2';


import { HutchCryptoService } from '../shared/hutch-crypto.service';
import { CoinDisplayed } from '../shared/coin';

export interface ExportCoinModel {
  coin: CoinDisplayed;
}
@Component({
    selector: 'my-hutch-message',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                   <div class='modal-header'>
                     <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                     <h4 class='modal-title' [innerHtml]='"modal_export_coin_title" | translate'></h4>
                   </div>
                   <div class='modal-body'>
                     <div class='row'>
                       <div class='col-md-12'>
                         <h4 [innerHtml]='"modal_export_coin_label" | translate: {name: coin.displayName}'></h4>
                       </div>
                     </div>
                     <div class='row'>
                       <div class='col-md-12'>
                         <label for="exportWithPassword" class="checkbox-inline">
                           <input type="checkbox" [(ngModel)]="exportWithPassword" name="exportWithPassword" id="exportWithPassword">
                           <span [innerHtml]="'modal_export_coin_with_password' | translate"></span>
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
export class ExportCoinComponent extends DialogComponent<ExportCoinModel, void> implements ExportCoinModel {
  coin: CoinDisplayed;

  exportWithPassword = false;
  exportPassword = '';

  constructor(dialogService: DialogService,
              private translate: TranslateService,
              private hutchCryptoService: HutchCryptoService,
              private toastrService: ToastrService) {
    super(dialogService);
  }

  close() {
    // Avoid annoying warning message, nothing less
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
        this.hutchCryptoService.encryptData([this.coin], passwordKey)
        .then((encryptedCoins) => {
          fileData = 'data:application/octet-stream,' + encryptedCoins;
          downloadAnchor.setAttribute('href', fileData);
          downloadAnchor.setAttribute('download', this.coin.displayName + '.bin');
          downloadAnchor.click();
        })
        .catch((error) => {
          this.toastrService.error(this.translate.instant('toaster_error_coin_export'), this.translate.instant('toaster_title'));
          if (isDevMode()) {
            console.log('Hutch debug', error);
          }
        });
      })
      .catch((error) => {
        this.toastrService.error(this.translate.instant('toaster_error_coin_export'), this.translate.instant('toaster_title'));
        if (isDevMode()) {
          console.log('Hutch debug', error);
        }
      });
    } else {
      fileData = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify([this.coin]));
      downloadAnchor.setAttribute('href', fileData);
      downloadAnchor.setAttribute('download', this.coin.displayName + '.json');
      downloadAnchor.click();
    }
  }

}
