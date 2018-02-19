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
import { Http, Jsonp, ResponseContentType } from '@angular/http';

import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/map';

export class WikimediaCommonsImageInfo {
  title: string;
  id: number;
}

@Injectable()
export class WikimediaCommonsService {
  // Get random image
  private url1 =
'https://commons.wikimedia.org/w/api.php?action=query&list=random&rnnamespace=6\
&rnlimit=1&prop=imageinfo&format=json&callback=JSONP_CALLBACK';
  // Get thumbail url of a random image
  private url2 =
'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo\
&iiprop=url&iiurlwidth=200&format=json&callback=JSONP_CALLBACK&titles=';

  constructor(private _jsonp: Jsonp, private http: Http) { }

  getRandomFile(): Promise<WikimediaCommonsImageInfo> {
    return this._jsonp.get(this.url1)
               .map(function (response) {
                 return { title: response.json().query.random[0].title, id: response.json().query.random[0].id };
                })
                .toPromise();
  }

  getFileUrlThumbnail (wikimediaCommonsImageInfo: WikimediaCommonsImageInfo): Promise<string> {
    return this._jsonp.get(this.url2 + wikimediaCommonsImageInfo.title)
               .map(function (response) {
                 return response.json().query.pages[wikimediaCommonsImageInfo.id].imageinfo[0].thumburl;
               })
               .toPromise();
  }

  getImageData(url: string) {
    return this.http.get(url, { responseType: ResponseContentType.ArrayBuffer });
  }
}
