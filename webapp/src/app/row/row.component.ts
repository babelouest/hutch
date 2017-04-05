import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Clipboard } from 'ts-clipboard';
import { DialogService } from 'ng2-bootstrap-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';

import { Row } from '../shared/coin';
import { ConfirmComponent } from '../modal/confirm.component';
import { EditTagsComponent } from '../modal/edit-tags.component';
import { GeneratePasswordComponent } from '../modal/generate-password.component';

@Component({
  selector: 'my-hutch-row',
  templateUrl: './row.component.html'
})
export class RowComponent implements OnInit {
  @Input() row: Row;
  @Input() index: number;
  @Output() onUpdate: EventEmitter<any> = new EventEmitter();

  constructor(private translate: TranslateService,
              private dialogService: DialogService) {
  }

  ngOnInit() {
  }

  copyToClipboard(value) {
    Clipboard.copy(value);
  }

  editRow(row) {
    row.edit = true;
    row.saveValue = row.value;
    if (row.type === 'password') {
      row.valueVerified = row.value;
    }
  }

  deleteRow() {
    this.dialogService.addDialog(ConfirmComponent, {
      title: this.translate.instant('coin_delete_row'),
      message: this.translate.instant('coin_delete_row_confirm')})
      .subscribe((result) => {
        if (result) {
          this.onUpdate.emit({type: 'delete', index: this.index});
        }
      });
  }

  showPassword(row) {
    if (!row.show) {
      this.dialogService.addDialog(ConfirmComponent, {
        title: this.translate.instant('coin_show_password'),
        message: this.translate.instant('coin_show_password_confirm')})
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

  cancelEditRow(row) {
    row.value = row.saveValue;
    delete row.saveValue;
    delete row.edit;
  }

  saveRow(row) {
    delete row.show;
    delete row.valueVerified;
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
    this.dialogService.addDialog(EditTagsComponent, { tags: (row.tags ? row.tags : []) })
      .subscribe((result) => {
        if (result) {
          row.tags = result;
          this.saveCoinInDatabase();
        }
      });
  }

  deleteSecretQuestion(row, index) {
    this.dialogService.addDialog(ConfirmComponent, {
      title: this.translate.instant('coin_delete_secret_question'),
      message: this.translate.instant('coin_delete_secret_question_confirm')})
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

  saveCoinInDatabase() {
    this.onUpdate.emit({type: 'update'});
  }
}
