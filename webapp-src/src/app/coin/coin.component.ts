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
import { Component, OnInit, Input, Output, EventEmitter, isDevMode } from '@angular/core';
import { DialogService } from 'ng2-bootstrap-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';
import { ToastrService } from 'ngx-toastr';

import { CoinDisplayed, Row } from '../shared/coin';
import { HutchCoinService } from '../shared/hutch-coin.service';
import { HutchCryptoService } from '../shared/hutch-crypto.service';
import { HutchConfigService } from '../shared/hutch-config.service';
import { HutchRowService } from '../shared/hutch-row.service';

import { ConfirmComponent } from '../modal/confirm.component';
import { GeneratePasswordComponent } from '../modal/generate-password.component';
import { ExportCoinComponent } from '../modal/export-coin.component';
import { ChooseIconComponent } from '../modal/choose-icon.component';
import { HistoryComponent } from '../modal/history.component';

import * as _ from 'lodash';

@Component({
  selector: 'my-hutch-coin',
  templateUrl: './coin.component.html'
})
export class CoinComponent implements OnInit {
  @Input() coin: CoinDisplayed;
  @Input() safeKey: any;
  @Input() safe: string;
  @Input() editCoinMode: boolean;
  @Output() onDeleteCoin: EventEmitter<any> = new EventEmitter();

  saveName: string;
  newRowMode = false;
  newRow: Row;
  fileMaxSize = 0;

  constructor(private translate: TranslateService,
              private dialogService: DialogService,
              private toastrService: ToastrService,
              private hutchCryptoService: HutchCryptoService,
              private hutchCoinService: HutchCoinService,
              private hutchConfigService: HutchConfigService,
              private hutchRowService: HutchRowService) {
  }

  ngOnInit() {
    this.hutchConfigService.get().then((config) => {
      this.fileMaxSize = config.api.maxLength;
    });
  }

  deleteCoin() {
    this.dialogService.addDialog(ConfirmComponent, {
      title: this.translate.instant('coin_delete_coin'),
      message: this.translate.instant('coin_delete_coin_confirm', { name: this.coin.displayName })})
      .subscribe((result) => {
        if (result) {
          this.hutchCoinService.delete(this.safe, this.coin.name)
          .then(() => {
            this.toastrService.success(this.translate.instant('toaster_success_coin_delete'), this.translate.instant('toaster_title'));
            this.onDeleteCoin.emit(this.coin);
          })
          .catch((error) => {
            this.toastrService.error(this.translate.instant('toaster_error_coin_delete'), this.translate.instant('toaster_title'));
            if (isDevMode()) {
              console.log('Hutch debug', error);
            }
          });
        }
      });
  }

  editCoin() {
    this.saveName = this.coin.displayName;
    this.editCoinMode = true;
  }

  saveCoin() {
    this.editCoinMode = false;
    this.saveCoinInDatabase();
  }

  cancelEditCoin() {
    this.editCoinMode = false;
    this.coin.displayName = this.saveName;
  }

  isNewRowValid() {
    return this.newRow &&
           this.newRow.type &&
           (this.newRow.type !== 'password' || (this.newRow.value && this.newRow.value === this.newRow.valueVerified));
  }

  saveNewRow() {
    if (this.isNewRowValid()) {
      delete this.newRow.valueVerified;
      this.coin.rows.push(this.newRow);
      this.newRow = {value: '', valueVerified: '', type: 'login'};
      this.newRowMode = false;
      this.saveCoinInDatabase();
    }
  }

  cancelEditNewRow() {
    this.newRowMode = false;
  }

  updateNewRowType() {
    if (this.newRow.type === 'secret-questions') {
      this.newRow.value = [];
    } else {
      this.newRow.value = '';
    }
  }

  addCoinRow() {
    this.newRowMode = true;
    let type = '';
    if (!_.find(this.coin.rows, { type: 'url' })) {
      type = 'url';
    } else if (!_.find(this.coin.rows, { type: 'login' })) {
      type = 'login';
    } else if (!_.find(this.coin.rows, { type: 'password' })) {
      type = 'password';
    }
    this.newRow = {value: '', valueVerified: '', type: type};
  }

  saveCoinInDatabase() {
    _.each(this.coin.rows, row => {
      delete row.show;
      delete row.valueVerified;
    });
    let saveCoin = { displayName: this.coin.displayName, icon: this.coin.icon, rows: this.coin.rows };
    return this.hutchCryptoService.encryptData(saveCoin, this.safeKey)
    .then((data) => {
      this.hutchCoinService.set(this.safe, this.coin.name, { data: data })
      .then(() => {
        this.toastrService.success(this.translate.instant('toaster_success_coin_save'), this.translate.instant('toaster_title'));
      })
      .catch((error) => {
        this.toastrService.error(this.translate.instant('toaster_error_coin_save'), this.translate.instant('toaster_title'));
        if (isDevMode()) {
          console.log('Hutch debug', error);
        }
      });
    })
    .catch((error) => {
      this.toastrService.error(this.translate.instant('toaster_error_coin_save'), this.translate.instant('toaster_title'));
      if (isDevMode()) {
        console.log('Hutch debug', error);
      }
    });
  }

  displayTags(row) {
    if (row.tags) {
      return row.tags.join(',');
    } else {
      return '';
    }
  }

  updateRows() {
    this.saveCoinInDatabase();
  }

  generatePassword(row) {
    this.dialogService.addDialog(GeneratePasswordComponent)
      .subscribe((result) => {
        if (result) {
          row.value = result;
          row.valueVerified = result;
          this.saveNewRow();
          this.copySuccess('password');
        }
      });
  }

  onUpdateCoin(action) {
    if (action && action.type === 'delete') {
      this.deleteRow(action.index);
    } else {
      this.saveCoinInDatabase();
    }
  }

  deleteRow(index) {
    this.coin.rows.splice(index, 1);
    this.saveCoinInDatabase();
  }

  exportCoin() {
    this.dialogService.addDialog(ExportCoinComponent, { coin: { displayName: this.coin.displayName, rows: this.coin.rows } });
  }

  fileChange(event) {
    this.hutchRowService.fileChange(event, this.newRow);
  }

  changeIcon() {
    this.dialogService.addDialog(ChooseIconComponent)
      .subscribe((result) => {
        if (result) {
          this.coin.icon = result;
        }
      });
  }

  copySuccess(type) {
    this.hutchRowService.copySuccess(type);
  }

  enableSort(coin) {
    coin.dragEnabled = !coin.dragEnabled;
    if (coin.dragEnabled) {
      this.toastrService.success(this.translate.instant('toaster_coin_sort_enabled'), this.translate.instant('toaster_title'));
    } else {
      this.toastrService.success(this.translate.instant('toaster_coin_sort_disabled'), this.translate.instant('toaster_title'));
    }
  }

  coinHistory() {
    this.dialogService.addDialog(HistoryComponent, {
      type: 'coin',
      safe: this.safe,
      coin: this.coin.name
    });
  }

  copyToClipboard(value, type) {
    let copyElement = document.createElement('input');
    document.body.appendChild(copyElement);
    copyElement.setAttribute('id', 'copy_element_id');
    let copyDOMElement = document.getElementById('copy_element_id') as HTMLInputElement;
    copyDOMElement.value = value;
    copyElement.select();
    document.execCommand('copy');
    document.body.removeChild(copyElement);
    this.hutchRowService.copySuccess(type);
  }
}
