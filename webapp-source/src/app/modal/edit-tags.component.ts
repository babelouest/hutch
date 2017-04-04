import { Component } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
export interface EditTagsModel {
  tags: string;
}
@Component({
    selector: 'my-hutch-edit-tags',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                   <div class='modal-header'>
                     <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                     <h4 class='modal-title' [innerHtml]='"modal_tags_title" | translate'></h4>
                   </div>
                   <div class='modal-body'>
                     <p [innerHtml]='"modal_tags_message" | translate'></p>
                     <input type='text' data-role='tagsinput' [(ngModel)]='tags' [placeholder]='"modal_tags_placeholder" | translate''>
                   </div>
                   <div class='modal-footer'>
                     <button type='button'
                             class='btn btn-default'
                             (click)='confirm()'
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
export class EditTagsComponent extends DialogComponent<EditTagsModel, string> implements EditTagsModel {
  tags: string;
  constructor(dialogService: DialogService) {
    super(dialogService);
  }

  confirm() {
    // we set dialog result as true on click on confirm button,
    // then we can get dialog result from caller code
    this.result = this.tags;
    this.close();
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }
}
