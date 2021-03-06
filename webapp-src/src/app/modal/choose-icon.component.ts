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

import { HutchIconListService } from '../shared/hutch-icon-list.service';

import * as _ from 'lodash';

@Component({
    selector: 'my-hutch-confirm',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                   <div class='modal-header'>
                     <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                     <h4 class='modal-title' [innerHtml]='"choose_icon_modal_title" | translate'></h4>
                   </div>
                   <div class='modal-body'>
                     <p [innerHtml]='"choose_icon_modal_message" | translate'></p>
                     <div class='well text-center' *ngIf='loading'>
                       <i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>
                     </div>
                     <div class='well sidebar-nav' *ngIf='!loading'>
                       <div class='row'>
                         <div class='col-md-12'>
                           <input type='text'
                                  class='form-control'
                                  [placeholder]='"placeholder_search" | translate'
                                  [(ngModel)]='search'
                                  (ngModelChange)='searchIcon()'>
                         </div>
                       </div>
                       <hr>
                       <div class='row'>
                         <div class='col-md-4'>
                           <span class='label label-info' [innerHtml]='"choose_icon_modal_selected" | translate'></span>
                         </div>
                         <div class='col-md-4'>
                           <i class='fa fa-3x {{result}}' *ngIf='result'></i>
                           <span class='label label-info'
                                 [innerHtml]='"choose_icon_modal_selected_none" | translate'
                                 *ngIf='!result'></span>
                         </div>
                       </div>
                       <hr>
                       <ul class='nav' style='max-height: 300px; overflow-y:scroll;'>
                         <li *ngFor='let icon of iconListDisplayed'>
                           <div class='row'>
                             <div class='col-md-4'>
                               <i class='fa fa-2x {{icon.class}}'></i>
                             </div>
                             <div class='col-md-4'>
                               <span class='label label-info' [innerHtml]='icon.label' style='font-size: 12px;'></span>
                             </div>
                             <div class='col-md-4'>
                               <button type='button'
                                       class='btn btn-default'
                                       (click)='selectIcon(icon.class)'
                                       [title]='"button_select" | translate'
                                       [innerHtml]='"button_select" | translate'>
                               </button>
                             </div>
                           </div>
                         </li>
                       </ul>
                     </div>
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
                             (click)='cancel()'
                             [title]='"button_cancel" | translate'
                             [innerHtml]='"button_cancel" | translate'>
                     </button>
                   </div>
                 </div>
              </div>`
})
export class ChooseIconComponent extends DialogComponent<void, string> implements OnInit {
  iconList: any[];
  iconListDisplayed: any[];
  search = '';
  result = '';
  loading = true;

  constructor(dialogService: DialogService,
              private hutchIconListService: HutchIconListService) {
    super(dialogService);
  }

  ngOnInit() {
    this.hutchIconListService.get().then((result) => {
      this.iconList = result;
      this.iconListDisplayed = result;
      this.loading = false;
    });
  }

  selectIcon(icon) {
    this.result = icon;
  }

  searchIcon() {
    this.loading = true;
    if (this.search) {
      this.iconListDisplayed = _.filter(this.iconList, (icon) => {
        return icon.class.includes(this.search.toLowerCase()) && icon.label.includes(this.search.toLowerCase());
      });
      this.loading = false;
    } else {
      this.iconListDisplayed = this.iconList;
      this.loading = false;
    }
  }

  confirm() {
    this.close();
  }

  cancel() {
    this.result = '';
    super.close();
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }
}
