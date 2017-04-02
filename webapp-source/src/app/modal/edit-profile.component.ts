import { Component, OnInit } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';

import { WikimediaCommonsService } from '../shared/wikimedia-commons.service';

// declare function unescape(s: string): string;

export interface EditProfileModel {
  fortune: string;
  picture: string;
}
@Component({
    selector: 'my-hutch-confirm',
    template: `<div class='modal-dialog modal-lg'>
                <div class='modal-content'>
                  <div class='modal-header'>
                    <button type='button' class='close' (click)='close()'>&times;</button>
                    <h4 class='modal-title'>Edit profile</h4>
                  </div>
                  <div class='modal-body'>
                    <div class='row'>
                      <div class='col-xs-3'>
                        <label>Fortune message</label>
                      </div>
                      <div class='col-xs-9'>
                        <input type='text' class='form-control' [(ngModel)]='fortune' placeholder='Fortune message'>
                      </div>
                    </div>
                    <hr>
                    <div class='row'>
                      <div class='col-xs-3'>
                        <label>Fortune image</label>
                      </div>
                      <div class='col-xs-9'>
                        <i class="fa fa-spinner fa-spin" aria-hidden="true" *ngIf='!showImage'></i>
                        <img [src]='picture' id='randomImage' alt='Random Image' *ngIf='showImage'>
                        <i class="fa fa-exclamation-circle" aria-hidden="true" *ngIf='errorImage'></i>
                        <span *ngIf='errorImage'>Error loading image, retry</span>
                        <hr>
                        <button type='button'
                                class='btn btn-default'
                                (click)='getNewImage()' >
                          Get random image from Wikimedia Commons
                        </button>
                        <hr>
                        <span>Or upload a loal file:</span>
                        <input type='file'
                               id='localFile'
                               (change)="fileChange($event)"
                               placeholder="Select local image"
                               accept=".jpg,.jpg,.png,.gif,.bmp" />
                      </div>
                    </div>
                  </div>
                  <div class='modal-footer'>
                    <button type='button' class='btn btn-default' (click)='confirm()' [disabled]='!isValid()'>OK</button>
                    <button type='button' class='btn btn-default' (click)='close()' >Cancel</button>
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
