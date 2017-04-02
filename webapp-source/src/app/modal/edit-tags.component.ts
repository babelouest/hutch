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
                     <button type='button' class='close' (click)='close()'>&times;</button>
                     <h4 class='modal-title'>Edit tags</h4>
                   </div>
                   <div class='modal-body'>
                     <p>Enter a list of tags separated by a comma</p>
                     <input type='text' data-role='tagsinput' [(ngModel)]='tags'>
                   </div>
                   <div class='modal-footer'>
                     <button type='button' class='btn btn-default' (click)='confirm()'>OK</button>
                     <button type='button' class='btn btn-default' (click)='close()' >Cancel</button>
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
