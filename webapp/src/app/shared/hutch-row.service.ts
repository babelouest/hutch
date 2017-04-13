import { Injectable, isDevMode }    from '@angular/core';

import { TranslateService } from 'ng2-translate/ng2-translate';
import { ToastrService } from 'toastr-ng2';

import { HutchConfigService } from './hutch-config.service';
import { HutchCryptoService } from './hutch-crypto.service';

@Injectable()
export class HutchRowService {
  fileMaxSize: number;

  constructor(private translate: TranslateService,
              private toastrService: ToastrService,
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

}
