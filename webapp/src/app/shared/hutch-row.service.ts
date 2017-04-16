import { Injectable, isDevMode }    from '@angular/core';
import { DialogService } from 'ng2-bootstrap-modal';

import { TranslateService } from 'ng2-translate/ng2-translate';
import { ToastrService } from 'toastr-ng2';

import { HutchConfigService } from './hutch-config.service';
import { HutchCryptoService } from './hutch-crypto.service';
import { GeneratePasswordComponent } from '../modal/generate-password.component';

@Injectable()
export class HutchRowService {
  fileMaxSize: number;

  constructor(private translate: TranslateService,
              private toastrService: ToastrService,
              private dialogService: DialogService,
              private config: HutchConfigService,
              private hutchCryptoService: HutchCryptoService) {
     this.config.get()
    .then(curConfig => {
      this.fileMaxSize = curConfig.api.maxLength;
    })
    .catch((error) => {
      if (isDevMode()) {
        console.log('Hutch debug', error);
      }
    });
 }

  fileChange(event, row) {
    let self = this;
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      let fr = new FileReader();
      fr.onload = function(ev2: any) {
        if (ev2.target.result.length < self.fileMaxSize) {
          row.value = {
            name: event.target.value,
            data: self.hutchCryptoService.arrayBufferToBase64(
                    self.hutchCryptoService.convertStringToArrayBufferView(
                      ev2.target.result
                    )
                  )
          };
        } else {
          self.toastrService.error(self.translate.instant('toaster_error_file_too_large'), self.translate.instant('toaster_title'));
        }
      };
      fr.readAsBinaryString(file);
    }
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

  copySuccess(type) {
    let translate_message = '';
    switch (type) {
      case 'secret-questions':
        translate_message = 'toaster_success_copy_clipboard_secret_answer';
        break;
      case 'login':
        translate_message = 'toaster_success_copy_clipboard_login';
        break;
      case 'password':
        translate_message = 'toaster_success_copy_clipboard_password';
        break;
      default:
        translate_message = 'toaster_success_copy_clipboard_value';
        break;
    }
    this.toastrService.success(this.translate.instant(translate_message), this.translate.instant('toaster_title'));
  }
}
