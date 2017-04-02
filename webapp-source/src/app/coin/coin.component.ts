import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DialogService } from 'ng2-bootstrap-modal';
import { Clipboard } from 'ts-clipboard';

import { CoinDisplayed, Row } from '../shared/coin';
import { ConfirmComponent } from '../modal/confirm.component';
import { EditTagsComponent } from '../modal/edit-tags.component';
import { GeneratePasswordComponent } from '../modal/generate-password.component';
import { HutchCryptoService } from '../shared/hutch-crypto.service';
import { HutchCoinService } from '../shared/hutch-coin.service';

@Component({
  selector: 'my-hutch-coin',
  templateUrl: './coin.component.html',
  styleUrls: ['./coin.component.scss']
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

  constructor(private dialogService: DialogService,
              private hutchCryptoService: HutchCryptoService,
              private hutchCoinService: HutchCoinService) {
  }

  ngOnInit() {
  }

  deleteCoin() {
    this.dialogService.addDialog(ConfirmComponent, {
      title: 'Delete secret',
      message: 'Are you sure you want to delete secret ' + this.coin.displayName + '?'})
      .subscribe((result) => {
        if (result) {
          this.hutchCoinService.delete(this.safe, this.coin.name).then(() => {
            this.onDeleteCoin.emit(this.coin);
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

  copyToClipboard(value) {
    Clipboard.copy(value);
  }

  editRow(row) {
    row.edit = true;
    row.saveValue = row.value;
    if (row.type === 'password') {
      row.value = '';
      row.valueVerified = '';
    }
  }

  showPassword(row) {
    if (!row.show) {
      this.dialogService.addDialog(ConfirmComponent, {
        title: 'Show password',
        message: 'Are you sure you want to show this password?'})
        .subscribe((result) => {
          if (result) {
            row.show = true;
          }
        });
    } else {
      row.show = false;
    }
  }

  isRowValid(row) {
    return row.value &&
           (row.type !== 'password' ||
            (row.value === row.valueVerified)
           );
  }

  addSecretQuestion(row) {
    row.value.push({edit: true, question: '', answer: ''});
  }

  deleteRow(index) {
    this.dialogService.addDialog(ConfirmComponent, {
      title: 'Delete row',
      message: 'Are you sure you want to delete this row?'})
      .subscribe((result) => {
        if (result) {
          this.coin.rows.splice(index, 1);
          this.saveCoinInDatabase();
        }
      });
  }

  cancelEditRow(row) {
    row.value = row.saveValue;
    delete row.saveValue;
    delete row.edit;
  }

  saveRow(row) {
    delete row.saveValue;
    delete row.edit;
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

  editSecretQuestion(secretQuestion) {
    secretQuestion.edit = true;
    secretQuestion.saveQuestion = secretQuestion.question;
    secretQuestion.saveAnswer = secretQuestion.answer;
  }

  editTags(row) {
    this.dialogService.addDialog(EditTagsComponent, { tags: (row.tags ? row.tags.join(',') : '') })
      .subscribe((result) => {
        if (result) {
          row.tags = result.split(',');
          this.saveCoinInDatabase();
        }
      });
  }

  deleteSecretQuestion(row, index) {
    this.dialogService.addDialog(ConfirmComponent, {
      title: 'Delete secret question',
      message: 'Are you sure you want to delete this secret question?'})
      .subscribe((result) => {
        if (result) {
          row.value.splice(index, 1);
          this.saveCoinInDatabase();
        }
      });
  }

  cancelEditSecretQuestion(secretQuestion, row, index) {
    if (secretQuestion.saveAnswer) {
      secretQuestion.answer = secretQuestion.saveAnswer;
      secretQuestion.question = secretQuestion.saveQuestion;
      delete secretQuestion.saveQuestion;
      delete secretQuestion.saveAnswer;
    } else {
      row.value.splice(index, 1);
    }
    delete secretQuestion.edit;
  }

  saveSecretQuestion(secretQuestion) {
    delete secretQuestion.saveQuestion;
    delete secretQuestion.saveAnswer;
    delete secretQuestion.edit;
    this.saveCoinInDatabase();
  }

  addCoinRow() {
    this.newRowMode = true;
    this.newRow = {value: '', valueVerified: '', type: 'login'};
  }

  isNewRowValid() {
    return this.newRow &&
           this.newRow.type &&
           (this.newRow.type !== 'password' || (this.newRow.value && this.newRow.value === this.newRow.valueVerified));
  }

  saveNewRow() {
    if (this.isNewRowValid()) {
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

  updateRows() {
    this.saveCoinInDatabase();
  }

  saveCoinInDatabase() {
    let saveCoin = { displayName: this.coin.displayName, rows: this.coin.rows };
    return this.hutchCryptoService.encryptData(saveCoin, this.safeKey).then((data) => {
      this.hutchCoinService.set(this.safe, this.coin.name, { data: data }).then(() => {
        // TODO: Display message
      });
    });
  }
}
