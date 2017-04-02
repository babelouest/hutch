import { Injectable }    from '@angular/core';

import { HutchApiService } from './hutch-api.service';

import 'rxjs/add/operator/toPromise';

import { Profile } from './profile';

@Injectable()
export class HutchProfileService {

  constructor(private hutchApiService: HutchApiService) { }

  getProfile(): Promise<Profile> {
    return this.hutchApiService.httpRequest('GET', '/profile')
               .then(function (result) {
                 return result.json();
               });
  }

  setProfile(profile: Profile): Promise<void> {
    return this.hutchApiService.httpRequest('PUT', '/profile', null, profile);
  }
}
