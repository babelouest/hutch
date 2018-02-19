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
import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule, JsonpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { removeNgStyles, createNewHosts } from '@angularclass/hmr';
import { ToastrModule } from 'ngx-toastr';

import { DndModule } from 'ng2-dnd';
import { BootstrapModalModule } from 'ng2-bootstrap-modal';
import { CookieService } from 'angular2-cookie/services/cookies.service';
import { TranslateModule } from 'ng2-translate/ng2-translate';

import { routing } from './app.routing';
import { AppComponent } from './app.component';

import { HomeComponent } from './home/home.component';
import { SafeComponent } from './safe/safe.component';
import { CoinComponent } from './coin/coin.component';
import { RowComponent } from './row/row.component';

import { Oauth2ConnectComponent } from './oauth2-connect/oauth2-connect.component';
import { Oauth2ConnectObservable } from './oauth2-connect/oauth2-connect.service';

import { ConfirmComponent } from './modal/confirm.component';
import { MessageComponent } from './modal/message.component';
import { GeneratePasswordComponent } from './modal/generate-password.component';
import { EditSafeComponent } from './modal/edit-safe.component';
import { EditProfileComponent } from './modal/edit-profile.component';
import { EditTagsComponent } from './modal/edit-tags.component';
import { ManageSafeComponent } from './modal/manage-safe.component';
import { ResetPasswordSafeComponent } from './modal/reset-password-safe.component';
import { ExportCoinComponent } from './modal/export-coin.component';
import { ChooseIconComponent } from './modal/choose-icon.component';
import { ChangeSafeKeyComponent } from './modal/change-safe-key.component';
import { DeleteSafeComponent } from './modal/delete-safe.component';
import { HistoryComponent } from './modal/history.component';

import { WikimediaCommonsService } from './shared/wikimedia-commons.service';
import { HutchApiService } from './shared/hutch-api.service';
import { HutchProfileService } from './shared/hutch-profile.service';
import { HutchSafeService } from './shared/hutch-safe.service';
import { HutchCoinService } from './shared/hutch-coin.service';
import { HutchCryptoService } from './shared/hutch-crypto.service';
import { HutchObserveService } from './shared/hutch-observe.service';
import { HutchConfigService } from './shared/hutch-config.service';
import { HutchRandomWordService } from './shared/hutch-random-word.service';
import { HutchIconListService } from './shared/hutch-icon-list.service';
import { HutchRowService } from './shared/hutch-row.service';
import { CoinFilterPipe } from './shared/coin-filter.pipe';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    JsonpModule,
    FormsModule,
    routing,
    BootstrapModalModule,
    DndModule.forRoot(),
    TranslateModule.forRoot(),
    ToastrModule.forRoot()
  ],
  declarations: [
    AppComponent,
    HomeComponent,
    SafeComponent,
    CoinComponent,
    RowComponent,
    Oauth2ConnectComponent,
    ConfirmComponent,
    MessageComponent,
    GeneratePasswordComponent,
    EditSafeComponent,
    EditProfileComponent,
    EditTagsComponent,
    ManageSafeComponent,
    ResetPasswordSafeComponent,
    ExportCoinComponent,
    ChooseIconComponent,
    ChangeSafeKeyComponent,
    DeleteSafeComponent,
    HistoryComponent,
    CoinFilterPipe
  ],
  entryComponents: [
    ConfirmComponent,
    MessageComponent,
    GeneratePasswordComponent,
    EditSafeComponent,
    EditProfileComponent,
    EditTagsComponent,
    ManageSafeComponent,
    ResetPasswordSafeComponent,
    ExportCoinComponent,
    ChooseIconComponent,
    ChangeSafeKeyComponent,
    DeleteSafeComponent,
    HistoryComponent
  ],
  providers: [
    CookieService,
    WikimediaCommonsService,
    HutchConfigService,
    HutchApiService,
    HutchProfileService,
    HutchSafeService,
    HutchCoinService,
    HutchCryptoService,
    HutchObserveService,
    HutchRandomWordService,
    Oauth2ConnectObservable,
    HutchIconListService,
    HutchRowService,
    CoinFilterPipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(public appRef: ApplicationRef) {}
  hmrOnInit(store) {
    console.log('HMR store', store);
  }
  hmrOnDestroy(store) {
    let cmpLocation = this.appRef.components.map(cmp => cmp.location.nativeElement);
    // recreate elements
    store.disposeOldHosts = createNewHosts(cmpLocation);
    // remove styles
    removeNgStyles();
  }
  hmrAfterDestroy(store) {
    // display new elements
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }
}
