import { Injectable }    from '@angular/core';
import { Http } from '@angular/http';
import { TranslateService } from 'ng2-translate/ng2-translate';

import 'rxjs/add/operator/toPromise';

@Injectable()
export class HutchRandomWordService {

  constructor(private http: Http,
              private translate: TranslateService) {
  }

  get(iteration = 1): Promise<any> {
    return this.http.get('words-' + this.translate.currentLang + '.json')
               .toPromise()
               .then((result) => {
                 let random = new Uint16Array(iteration);
                 window.crypto.getRandomValues(random);
                 let wordList = result.json();
                 let toReturn = [];
                 for (let i = 0; i < iteration; i++) {
                   toReturn.push(wordList[ random[i] % wordList.length ]);
                 }
                 return toReturn;
               });
  }
}
