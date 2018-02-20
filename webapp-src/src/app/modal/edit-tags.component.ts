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
import { Component, OnInit } from '@angular/core';
import { DialogComponent, DialogService } from 'ng2-bootstrap-modal';
export interface EditTagsModel {
  tags: string[];
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
                     <form (ngSubmit)='addTag()'>
                       <div class='input-group'>
                           <input type='text'
                                  class='form-control'
                                  data-role='tagsinput'
                                  name='newTag'
                                  [(ngModel)]='newTag'
                                  [placeholder]='"modal_tags_placeholder" | translate'>
                           <div class='input-group-btn'>
                             <button type='submit' class='btn btn-default' [title]='"button_add" | translate'>
                               <i class="fa fa-plus" aria-hidden="true"></i>
                             </button>
                           </div>
                       </div>
                     </form>
                     <a *ngFor='let tag of newTags; let i = index'
                        href='' (click)='removeTag($event, i)'
                        class='label label-primary'
                        style='margin-right: 5px;'>
                       <span [innerHtml]='tag'></span>
                       &nbsp;
                       <span class='badge'>
                         <i class="icon-resize-small fa fa-close" aria-hidden="true"></i>
                       </span>
                     </a>
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
export class EditTagsComponent extends DialogComponent<EditTagsModel, string[]> implements EditTagsModel, OnInit {
  tags: string[];
  newTags: string[];
  newTag: string;

  constructor(dialogService: DialogService) {
    super(dialogService);
  }

  ngOnInit() {
    this.newTags = this.tags.slice();
  }

  confirm() {
    this.result = this.newTags;
    this.close();
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }

  removeTag(event, i) {
    event.preventDefault();
    this.newTags.splice(i, 1);
  }

  addTag() {
    this.newTags.push(this.newTag);
    this.newTag = '';
  }
}
