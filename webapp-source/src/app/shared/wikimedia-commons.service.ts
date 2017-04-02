
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
