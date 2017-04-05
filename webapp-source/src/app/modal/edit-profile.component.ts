import { Component, OnInit } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';

import { WikimediaCommonsService } from '../shared/wikimedia-commons.service';

export interface EditProfileModel {
  fortune: string;
  picture: string;
}
@Component({
    selector: 'my-hutch-confirm',
    template: `<div class='modal-dialog modal-lg'>
                <div class='modal-content'>
                  <div class='modal-header'>
                    <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                    <h4 class='modal-title' [innerHtml]='"modal_edit_profile_title" | translate'></h4>
                  </div>
                  <div class='modal-body'>
                    <div class='row'>
                      <div class='col-xs-3'>
                        <label [innerHtml]='"modal_profile_fortune_message" | translate'></label>
                      </div>
                      <div class='col-xs-9'>
                        <input type='text'
                               class='form-control'
                               [(ngModel)]='fortune'
                               [placeholder]='"modal_profile_fortune_message" | translate'>
                      </div>
                    </div>
                    <hr>
                    <div class='row'>
                      <div class='col-xs-3'>
                        <label [innerHtml]='"modal_profile_fortune_image_label" | translate'></label>
                      </div>
                      <div class='col-xs-9'>
                        <i class="fa fa-spinner fa-spin" aria-hidden="true" *ngIf='!showImage'></i>
                        <img [src]='picture' id='randomImage' alt='Random Image' *ngIf='showImage'>
                        <i class="fa fa-exclamation-circle" aria-hidden="true" *ngIf='errorImage'></i>
                        <span *ngIf='errorImage' [innerHtml]='"get_random_image_error" | translate'></span>
                        <hr>
                        <button type='button'
                                class='btn btn-default'
                                (click)='getNewImage()'
                                [title]='"get_random_image_message" | translate'
                                [innerHtml]='"get_random_image_message" | translate'>
                        </button>
                        <hr>
                        <span [innerHtml]='"get_local_image_message" | translate'></span>
                        <input type='file'
                               id='localFile'
                               (change)="fileChange($event)"
                                [placeholder]='"modal_profile_fortune_image" | translate'
                               accept=".jpg,.jpg,.png,.gif,.bmp" />
                      </div>
                    </div>
                  </div>
                  <div class='modal-footer'>
                    <button type='button'
                            class='btn btn-default'
                            (click)='confirm()'
                            [disabled]='!isValid()'
                            [title]='"button_ok" | translate'
                            [innerHtml]='"button_ok" | translate'>
                    </button>
                    <button type='button'
                            class='btn btn-default'
                            (click)='close()'
                            [title]='"button_cancel" | translate'
                            [innerHtml]='"button_cancel" | translate'>
                    </button>
                  </div>
               </div>
            </div>`
})
export class EditProfileComponent extends DialogComponent<EditProfileModel, EditProfileModel> implements EditProfileModel, OnInit {
  fortune: string;
  picture: string;
  showImage = false;
  errorImage = false;

  constructor(dialogService: DialogService, private wikimediaCommonsService: WikimediaCommonsService) {
    super(dialogService);
  }

  ngOnInit() {
    if (this.picture) {
      this.showImage = true;
    }
  }

  confirm() {
    this.result = {fortune: this.fortune, picture: this.picture};
    this.close();
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }

  isValid() {
    return this.fortune && this.picture;
  }

  getNewImage() {
    this.showImage = false;
    this.errorImage = false;
    this.wikimediaCommonsService.getRandomFile().then((result) => {
      this.wikimediaCommonsService.getFileUrlThumbnail(result).then((url) => {
        this.wikimediaCommonsService.getImageData(url)
        .map(function (res) {
          let binary = '';
          let bytes = new Uint8Array( res['_body'] );
          let len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
          }
          return 'data:' + res.headers.get('content-type') + ';base64,' + btoa( binary );
        })
        .subscribe((b64res) => {
          this.picture = b64res;
          this.showImage = true;
        });
      })
      .catch(() => {
        this.errorImage = true;
        this.showImage = false;
      });
    })
    .catch(() => {
      this.errorImage = true;
      this.showImage = false;
    });
  }

  fileChange(event) {
    let self = this;
    let fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      let file: File = fileList[0];
      let fr = new FileReader();
      fr.onload = function(ev2: any) {
        self.picture = ev2.target.result;
      };

      fr.readAsDataURL(file);
    }
  }
}
