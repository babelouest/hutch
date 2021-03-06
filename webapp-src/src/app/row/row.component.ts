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

import { Row } from '../shared/coin';
import { HutchRandomWordService } from '../shared/hutch-random-word.service';
import { HutchConfigService } from '../shared/hutch-config.service';
import { HutchRowService } from '../shared/hutch-row.service';

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

  fileMaxSize = 0;

  constructor(private translate: TranslateService,
              private dialogService: DialogService,
              private toastrService: ToastrService,
              private hutchRandomWordService: HutchRandomWordService,
              private hutchConfigService: HutchConfigService,
              private hutchRowService: HutchRowService) {
  }

  ngOnInit() {
    this.hutchConfigService.get().then((config) => {
      this.fileMaxSize = config.api.maxLength;
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
          this.hutchRowService.copySuccess('password');
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

  generateAnswer(secretQuestion) {
    this.hutchRandomWordService.get(2).then((results) => {
      secretQuestion.answer = results.join(' ');
      this.copyToClipboard(secretQuestion.answer, 'secret-questions');
      this.toastrService.success(this.translate.instant('toaster_success_answer_generated'), this.translate.instant('toaster_title'));
    })
    .catch((error) => {
      if (isDevMode()) {
        console.log('Hutch debug', error);
      }
      this.toastrService.error(this.translate.instant('toaster_error_answer_generated'), this.translate.instant('toaster_title'));
    });
  }

  downloadFile() {
    let fileData = 'data:application/octet-stream;base64,' + this.row.value.data;
    let downloadAnchor = document.getElementById('downloadAnchor');
    downloadAnchor.setAttribute('href', fileData);
    downloadAnchor.setAttribute('download', this.row.value.name);
    downloadAnchor.click();
  }

  fileChange(event) {
    this.hutchRowService.fileChange(event, this.row);
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
