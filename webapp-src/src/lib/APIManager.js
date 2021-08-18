import messageDispatcher from './MessageDispatcher';
import { jwtVerify } from 'jose-browser-runtime/jwt/verify';

class APIManager {
  constructor() {
    this.apiPrefix = "";
    this.token = "";
    this.signJwk = false;
  }

  setConfig(apiPrefix) {
    this.apiPrefix = apiPrefix;
  }
  
  setToken(token) {
    this.token = token;
  }
  
  setSignJwk(signJwk) {
    this.signJwk = signJwk;
  }
  
  getConfig(apiPrefix) {
    return this.apiPrefix;
  }

  request(url, method="GET", data=false, accept="application/json; charset=utf-8") {
    if (data && method !== "GET") {
      return $.ajax({
        method: method,
        url: url,
        headers: {
          "accept": accept,
          "content-type": "application/json; charset=utf-8",
          "Authorization": "Bearer " + this.token
        },
        data: JSON.stringify(data)
      });
    } else {
      return $.ajax({
        method: method,
        url: url,
        headers: {
          "accept": accept,
          "content-type": "application/json; charset=utf-8",
          "Authorization": "Bearer " + this.token
        }
      });
    }
  }

  requestSigned(url, method="GET", data=false) {
    var promise;
    if (data && method !== "GET") {
      promise = $.ajax({
        method: method,
        url: url,
        headers: {
          "accept": "application/jwt",
          "content-type": "application/json; charset=utf-8",
          "Authorization": "Bearer " + this.token
        },
        data: JSON.stringify(data)
      });
    } else {
      promise = $.ajax({
        method: method,
        url: url,
        headers: {
          "accept": "application/jwt",
          "content-type": "application/json; charset=utf-8",
          "Authorization": "Bearer " + this.token
        }
      });
    }
    return promise
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
