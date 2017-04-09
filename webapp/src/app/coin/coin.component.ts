import { Component, OnInit, Input, Output, EventEmitter, isDevMode } from '@angular/core';
import { DialogService } from 'ng2-bootstrap-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';

import { CoinDisplayed, Row } from '../shared/coin';
import { HutchCoinService } from '../shared/hutch-coin.service';
import { HutchCryptoService } from '../shared/hutch-crypto.service';

import { ConfirmComponent } from '../modal/confirm.component';
import { GeneratePasswordComponent } from '../modal/generate-password.component';

import * as _ from 'lodash';

declare var Clipboard: any;

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

  constructor(private translate: TranslateService,
              private dialogService: DialogService,
              private hutchCryptoService: HutchCryptoService,
              private hutchCoinService: HutchCoinService) {
  }

  ngOnInit() {
    new Clipboard('.btn-copy', {
      text: function(trigger) {
        return trigger.getAttribute('data-hutch-clipboard');
      }
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
            this.onDeleteCoin.emit(this.coin);
          })
          .catch((error) => {
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
    let saveCoin = { displayName: this.coin.displayName, rows: this.coin.rows };
    return this.hutchCryptoService.encryptData(saveCoin, this.safeKey)
    .then((data) => {
      this.hutchCoinService.set(this.safe, this.coin.name, { data: data })
      .then(() => {
        // TODO: Display message
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

}
