import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule, JsonpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { removeNgStyles, createNewHosts } from '@angularclass/hmr';
import { ToastrModule } from 'toastr-ng2';

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

@NgModule({
  imports: [
    BrowserModule,
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
    ChangeSafeKeyComponent
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
    ChangeSafeKeyComponent
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
    HutchIconListService
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
