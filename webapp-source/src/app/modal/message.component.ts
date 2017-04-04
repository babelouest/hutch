import { Component } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
export interface MessageModel {
  title: string;
  message: string;
}
@Component({
    selector: 'my-hutch-message',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                   <div class='modal-header'>
                     <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                     <h4 class='modal-title' [innerHtml]='title'></h4>
                   </div>
                   <div class='modal-body'>
                     <p [innerHtml]='message'></p>
                   </div>
                   <div class='modal-footer'>
                     <button type='button'
                             class='btn btn-default'
                             (click)='close()'
                             [title]='"button_close" | translate'
                             [innerHtml]='"button_close" | translate'>
                     </button>
                   </div>
                 </div>
              </div>`
})
export class MessageComponent extends DialogComponent<MessageModel, void> implements MessageModel {
  title: string;
  message: string;
  constructor(dialogService: DialogService) {
    super(dialogService);
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }
}
