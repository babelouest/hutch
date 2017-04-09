import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DialogService } from 'ng2-bootstrap-modal';
import { TranslateService } from 'ng2-translate/ng2-translate';

import { Row } from '../shared/coin';
import { ConfirmComponent } from '../modal/confirm.component';
import { EditTagsComponent } from '../modal/edit-tags.component';
import { GeneratePasswordComponent } from '../modal/generate-password.component';

declare var Clipboard: any;

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
    new Clipboard('.btn-copy', {
      text: function(trigger) {
        return trigger.getAttribute('data-hutch-clipboard');
      }
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  editRow() {
    this.row.edit = true;
    this.row.saveValue = this.row.value;
    if (this.row.type === 'password') {
      this.row.valueVerified = this.row.value;
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

  showPassword(event) {
    event.preventDefault();
    if (!this.row.show) {
      this.dialogService.addDialog(ConfirmComponent, {
        title: this.translate.instant('coin_show_password'),
        message: this.translate.instant('coin_show_password_confirm')})
        .subscribe((result) => {
          if (result) {
            this.row.show = true;
          }
        });
    } else {
      this.row.show = false;
    }
  }

  isRowValid() {
    return this.row.value &&
           (this.row.type !== 'password' ||
            (this.row.value === this.row.valueVerified)
           );
  }

  addSecretQuestion() {
    this.row.value.push({edit: true, question: '', answer: ''});
  }

  cancelEditRow() {
    this.row.value = this.row.saveValue;
    delete this.row.saveValue;
    delete this.row.edit;
  }

  saveRow() {
    delete this.row.show;
    delete this.row.valueVerified;
    delete this.row.saveValue;
    delete this.row.edit;
    this.saveCoinInDatabase();
  }

  generatePassword() {
    this.dialogService.addDialog(GeneratePasswordComponent)
      .subscribe((result) => {
        if (result) {
          this.row.value = result;
          this.row.valueVerified = result;
          this.saveRow();
        }
      });
  }

  editSecretQuestion(secretQuestion) {
    secretQuestion.edit = true;
    secretQuestion.saveQuestion = secretQuestion.question;
    secretQuestion.saveAnswer = secretQuestion.answer;
  }

  editTags() {
    this.dialogService.addDialog(EditTagsComponent, { tags: (this.row.tags ? this.row.tags : []) })
      .subscribe((result) => {
        if (result) {
          this.row.tags = result;
          this.saveCoinInDatabase();
        }
      });
  }

  deleteSecretQuestion(index) {
    this.dialogService.addDialog(ConfirmComponent, {
      title: this.translate.instant('coin_delete_secret_question'),
      message: this.translate.instant('coin_delete_secret_question_confirm')})
      .subscribe((result) => {
        if (result) {
          this.row.value.splice(index, 1);
          this.saveCoinInDatabase();
        }
      });
  }

  cancelEditSecretQuestion(secretQuestion, index) {
    if (secretQuestion.saveAnswer) {
      secretQuestion.answer = secretQuestion.saveAnswer;
      secretQuestion.question = secretQuestion.saveQuestion;
      delete secretQuestion.saveQuestion;
      delete secretQuestion.saveAnswer;
    } else {
      this.row.value.splice(index, 1);
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
