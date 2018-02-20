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

import { HutchProfileService } from '../shared/hutch-profile.service';
import { HutchSafeService } from '../shared/hutch-safe.service';
import { HutchCoinService } from '../shared/hutch-coin.service';

export interface HistoryModel {
  type: string;
  safe?: string;
  coin?: string;
}
@Component({
    selector: 'my-hutch-message',
    template: `<div class='modal-dialog'>
                <div class='modal-content'>
                   <div class='modal-header'>
                     <button type='button' class='close' (click)='close()' [title]='"button_cancel" | translate'>&times;</button>
                     <h4 class='modal-title' [innerHtml]='"modal_history_title" | translate'></h4>
                   </div>
                   <div class='modal-body'>
                     <table class='table table-hover'>
                       <thead>
                         <tr>
                           <th [innerHtml]='"modal_history_table_date" | translate'></th>
                           <th [innerHtml]='"modal_history_table_source" | translate'></th>
                           <th [innerHtml]='"modal_history_table_access" | translate'></th>
                         </tr>
                       </thead>
                       <tbody>
                         <tr *ngFor='let row of historyList'>
                           <td [innerHtml]='row.date*1000 | date:"medium"'></td>
                           <td [innerHtml]='row.ip_source'></td>
                           <td [innerHtml]='"modal_history_table_access_type_" + row.access_type | translate'></td>
                         </tr>
                       </tbody>
                     </table>
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
export class HistoryComponent extends DialogComponent<HistoryModel, void> implements HistoryModel, OnInit {
  type: string;
  safe: string;
  coin: string;
  historyList: any[] = [];

  constructor(dialogService: DialogService,
              private hutchProfileService: HutchProfileService,
              private hutchSafeService: HutchSafeService,
              private hutchCoinService: HutchCoinService) {
    super(dialogService);
  }

  ngOnInit() {
    switch (this.type) {
      case 'profile':
        this.hutchProfileService.getProfileHistory().then((result) => {
          this.historyList = result;
        });
        break;
      case 'safe':
        this.hutchSafeService.history(this.safe).then((result) => {
          this.historyList = result;
        });
        break;
      case 'coin':
        this.hutchCoinService.history(this.safe, this.coin).then((result) => {
          this.historyList = result;
        });
        break;
    }
  }

  close() {
    // Avoid annoying warning message, nothing less
    super.close();
  }
}
