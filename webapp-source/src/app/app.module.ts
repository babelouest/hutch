import { NgModule, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule, JsonpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';
import { BootstrapModalModule } from 'ng2-bootstrap-modal';
import { DndModule } from 'ng2-dnd';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { SafeComponent } from './safe/safe.component';
import { CoinComponent } from './coin/coin.component';
import { routing } from './app.routing';

import { ConfirmComponent } from './modal/confirm.component';
import { GeneratePasswordComponent } from './modal/generate-password.component';
import { EditSafeComponent } from './modal/edit-safe.component';
import { EditProfileComponent } from './modal/edit-profile.component';
import { EditTagsComponent } from './modal/edit-tags.component';

import { WikimediaCommonsService } from './shared/wikimedia-commons.service';
import { HutchApiService } from './shared/hutch-api.service';
import { HutchProfileService } from './shared/hutch-profile.service';
import { HutchSafeService } from './shared/hutch-safe.service';
import { HutchCoinService } from './shared/hutch-coin.service';
import { HutchCryptoService } from './shared/hutch-crypto.service';
import { HutchStoreService } from './shared/hutch-store.service';
import { HutchObserveService } from './shared/hutch-observe.service';

import { removeNgStyles, createNewHosts } from '@angularclass/hmr';

@NgModule({
  imports: [
    BrowserModule,
    HttpModule,
    JsonpModule,
    FormsModule,
    routing,
    BootstrapModalModule,
    DndModule.forRoot()
  ],
  declarations: [
    AppComponent,
    HomeComponent,
    SafeComponent,
    CoinComponent,
    ConfirmComponent,
    GeneratePasswordComponent,
    EditSafeComponent,
    EditProfileComponent,
    EditTagsComponent
  ],
  entryComponents: [
    ConfirmComponent,
    GeneratePasswordComponent,
    EditSafeComponent,
    EditProfileComponent,
    EditTagsComponent
  ],
  providers: [
    WikimediaCommonsService,
    HutchApiService,
    HutchProfileService,
    HutchSafeService,
    HutchCoinService,
    HutchCryptoService,
    HutchStoreService,
    HutchObserveService
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
