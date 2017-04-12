import { Injectable }    from '@angular/core';
import { Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class HutchIconListService {

  constructor(private http: Http) {
  }

  get(): Promise<any> {
    return this.http.get('fa-list.json')
               .toPromise()
               .then((result) => {
                 return result.json();
               });
  }
}
