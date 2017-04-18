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
