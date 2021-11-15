import { jwtVerify } from 'jose-browser-runtime/jwt/verify';

import messageDispatcher from './MessageDispatcher';
import oidcConnector from './OIDCConnector';
import i18next from 'i18next';

class APIManager {
  constructor() {
    this.apiPrefix = "";
    this.token = "";
    this.token_expires_at = 0;
    this.signJwk = false;
    this.counter = 0;
  }

  setConfig(apiPrefix) {
    this.apiPrefix = apiPrefix;
  }
  
  setToken(token, token_expires_at) {
    this.token = token;
    this.token_expires_at = token_expires_at;
  }
  
  setSignJwk(signJwk) {
    this.signJwk = signJwk;
  }
  
  getConfig(apiPrefix) {
    return this.apiPrefix;
  }

	request(url, method="GET", data=false, accept="application/json; charset=utf-8") {
		if (this.counter <= 100) {
			this.counter++;
			var curDate = new Date();
			if (!this.token || this.token_expires_at*1000 > curDate.getTime()) {
        this.counter--;
				return this.APIRequestExecute(url, method, data, accept);
			} else {
        this.counter--;
        return oidcConnector.runRefreshToken()
        .then((res) => {
          this.token = res.token;
          this.token_expires_at = (curDate.getTime()/1000)+res.expires_in;
          return this.APIRequestExecute(url, method, data, accept);
        })
        .catch(() => {
          messageDispatcher.sendMessage('App', {action: "sessionTimeout"});
        });
			}
		} else {
			return Promise.reject("error too busy");
		}
	}
	
	APIRequestExecute(url, method, data, accept) {
    let headers = {
      Authorization: "Bearer " + this.token,
      accept: accept
    };
    let contentType = null;
    let jsonData = !!data?JSON.stringify(data):null;
    if (data) {
      contentType = "application/json; charset=utf-8";
    }
		return $.ajax({
			method: method,
			url: url,
			data: jsonData,
			contentType: contentType,
			headers: headers
		})
    .catch((err) => {
      if (err.status === 401) {
        messageDispatcher.sendMessage('App', {action: "sessionTimeout"});
      }
    });
	}
	
  requestSigned(url, method="GET", data=false) {
    return this.request(url, method, data)
    .then((body, result, response) => {
      if (response.getResponseHeader("content-type") === "application/jwt") {
        if (this.signJwk) {
          return jwtVerify(body, this.signJwk);
        } else {
          return Promise.reject("No public key to verify signature");
        }
      } else {
        return Promise.reject("invalid content-type");
      }
    });
  }
}

let apiManager = new APIManager();

export default apiManager;
