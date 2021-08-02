import Cookies from 'js-cookie';

class OIDCConnector {

	constructor() {
	}

  init(parameters) {
		// internal
		this.refreshToken = false;
		this.accessToken = false;
		this.changeStatusCb = [];
		this.connected = false;
		this.parameters = {};
		if (window.location.pathname !== "/") {
			this.localStorageKey = "hutchOidc-" + window.btoa(unescape(encodeURIComponent(window.location.pathname))).replace(/\=+$/m,'');
		} else {
			this.localStorageKey = "hutchOidc";
		}
		this.refreshTimeout = false;

		if (parameters) {
			this.parameters.storageType = parameters.storageType || "none";
			this.parameters.responseType = parameters.responseType || "code";
			this.parameters.scope = parameters.scope || "";
			this.parameters.openidConfigUrl = parameters.openidConfigUrl || "";
			this.parameters.authUrl = parameters.authUrl || "";
			this.parameters.tokenUrl = parameters.tokenUrl || "";
			this.parameters.clientId = parameters.clientId || "";
			this.parameters.clientPassword = parameters.clientPassword || "";
			this.parameters.redirectUri = parameters.redirectUri || "";
			this.parameters.userinfoUrl = parameters.userinfoUrl || "";
			if (parameters.changeStatusCb) {
				this.changeStatusCb.push(parameters.changeStatusCb);
			}
		}

    if (this.parameters.openidConfigUrl) {
      $.ajax({
        type: "GET",
        url: this.parameters.openidConfigUrl,
        success: (result) => {
          this.parameters.authUrl = result.authorization_endpoint;
          this.parameters.tokenUrl = result.token_endpoint;
          this.parameters.userinfoUrl = result.userinfo_endpoint;
          this.parseInitialUrl();
        },
        error: (error) => {
          this.broadcastMessage("error");
        }
      });
    } else {
      this.parseInitialUrl();
    }

	}

  parseInitialUrl() {
		var storedData;
		var token;
    if (this.parameters.responseType === "code") {
			var code = this.getCodeFromQuery();
			if (code) {
				this.getRefreshTokenFromCode(code, (refreshToken) => {
					if (refreshToken) {
						this.refreshToken = refreshToken.refresh_token;
						this.storeRefreshToken(this.refreshToken);
						if (refreshToken.access_token) {
							this.accessToken = {access_token: refreshToken.access_token, iat: refreshToken.iat, expires_in: refreshToken.expires_in};
							this.storeAccessToken(this.accessToken);
							this.broadcastMessage("connected", this.accessToken.access_token, (this.accessToken.iat + this.accessToken.expires_in));
							this.getConnectedProfile((res, profile) => {
								if (res) {
									this.broadcastMessage("profile", profile);
								}
							});
							this.refreshTokenLoop(refreshToken.refresh_token, this.accessToken.expires_in);
						} else {
							this.broadcastMessage("disconnected");
						}
					} else {
						this.broadcastMessage("disconnected");
					}
				});
				window.history.pushState(null, "", document.location.href.split("?")[0]);
			} else {
				storedData = this.getStoredData();
				if (storedData && storedData.accessToken && this.isTokenValid(storedData.accessToken)) {
					this.accessToken = storedData.accessToken;
					this.broadcastMessage("connected", this.accessToken.access_token, (this.accessToken.iat + this.accessToken.expires_in));
					this.getConnectedProfile((res, profile) => {
						if (res) {
							this.broadcastMessage("profile", profile);
						}
					});
					if (storedData.refreshToken) {
						var curDate = new Date();
						var timeout = Math.floor(((this.accessToken.iat + this.accessToken.expires_in)*1000 - curDate.getTime())/1000);
						this.refreshTokenLoop(storedData.refreshToken, timeout);
					}
				} else if (storedData && storedData.refreshToken) {
					this.accessToken = false;
					this.refreshToken = storedData.refreshToken;
					this.executeRefreshToken(storedData.refreshToken, (result, accessToken) => {
						if (result) {
							this.accessToken = accessToken;
							this.storeAccessToken(accessToken);
							this.refreshTokenLoop(storedData.refreshToken, this.accessToken.expires_in);
							this.broadcastMessage("connected", accessToken.access_token, (accessToken.iat + accessToken.expires_in));
							this.getConnectedProfile((res, profile) => {
								if (res) {
									this.broadcastMessage("profile", profile);
								}
							});
						}
					});
				} else {
					this.broadcastMessage("disconnected");
				}
			}
		} else {
      if (this.parameters.responseType.search("token") > -1) {
        token = this.getTokenFromFragment();
        if (token) {
          this.accessToken = token;
          document.location = "#";
          this.getConnectedProfile((res, profile) => {
            if (res) {
              this.broadcastMessage("connected", token.access_token, (token.iat + token.expires_in), profile);
            } else {
              this.broadcastMessage("connected", token.access_token, (token.iat + token.expires_in), false);
            }
          });
          this.storeAccessToken(token);
        } else {
          storedData = this.getStoredData();
          if (storedData && storedData.accessToken && this.isTokenValid(storedData.accessToken)) {
            this.accessToken = storedData.accessToken;
            this.broadcastMessage("connected", this.accessToken.access_token, (this.accessToken.iat + this.accessToken.expires_in));
            this.getConnectedProfile((res, profile) => {
              if (res) {
                this.broadcastMessage("profile", profile);
              }
            });
          } else {
            this.broadcastMessage("disconnected");
            this.accessToken = false;
          }
        }
      }
      if (this.parameters.responseType.search("id_token") > -1) {
        id_token = this.getQueryParams(document.location.hash).id_token;
        // TODO
      }
		}
  }

	getQueryParams(qs) {
		qs = qs.split('+').join(' ');

		var params = {},
			tokens,
			re = /[#&]?([^=]+)=([^&]*)/g;

		tokens = re.exec(qs);
		while (tokens) {
			params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
			tokens = re.exec(qs);
		}

		return params;
	}

	getTokenFromFragment() {
		var params = this.getQueryParams(document.location.hash);
		var curDate = new Date();
		if (params.access_token && params.expires_in)	{
			return {access_token: params.access_token, expires_in: params.expires_in, iat: Math.floor(curDate.getTime()/1000)};
		} else {
			return false;
		}
	}

	getCodeFromQuery() {
		var params = this.getQueryParams(document.location.search.substring(1));
		return params.code||false;
	}

	refresh(cb) {
		if (this.parameters.responseType === "code" && this.refreshToken) {
			this.executeRefreshToken(this.refreshToken, (result, accessToken) => {
				if (result) {
					this.accessToken = accessToken;
					this.storeAccessToken(accessToken);
					this.refreshTokenLoop(this.refreshToken, this.accessToken.expires_in);
					this.broadcastMessage("refresh", accessToken.access_token, (accessToken.iat + accessToken.expires_in));
					cb(accessToken.access_token);
				}
			});
		} else {
			cb(false);
		}
	}

	getToken() {
		if (this.accessToken && this.isTokenValid(this.accessToken)) {
			return this.accessToken.access_token;
		} else {
			this.accessToken = false;
			return false;
		}
	}

	getStatus() {
		if (this.accessToken && this.isTokenValid(this.accessToken)) {
			return "connected";
		} else {
			this.accessToken = false;
			return "disconnected";
		}
	}

	storeAccessToken(token) {
		var storedObject = this.getStoredData();
		if (!storedObject) {
			storedObject = {};
		}
		storedObject.accessToken = token;

		if (this.parameters.storageType === "local") {
			return localStorage.setItem(this.localStorageKey, JSON.stringify(storedObject));
		} else if (this.parameters.storageType === "cookie") {
			return Cookies.set(this.localStorageKey, JSON.stringify(storedObject));
		} else {
			return false;
		}
	}

	storeIDToken(token) {
		var storedObject = this.getStoredData();
		if (!storedObject) {
			storedObject = {};
		}
		storedObject.IDToken = token;

		if (this.parameters.storageType === "local") {
			return localStorage.setItem(this.localStorageKey, JSON.stringify(storedObject));
		} else if (this.parameters.storageType === "cookie") {
			return Cookies.set(this.localStorageKey, JSON.stringify(storedObject));
		} else {
			return false;
		}
	}

	storeRefreshToken(token) {
		var storedObject = this.getStoredData();
		if (!storedObject) {
			storedObject = {};
		}
		storedObject.refreshToken = token;

		if (this.parameters.storageType === "local") {
			return localStorage.setItem(this.localStorageKey, JSON.stringify(storedObject));
		} else if (this.parameters.storageType === "cookie") {
			return Cookies.set(this.localStorageKey, JSON.stringify(storedObject));
		} else {
			return false;
		}
	}

	storeNonce(nonce) {
		var storedObject = this.getStoredData();
		if (!storedObject) {
			storedObject = {};
		}
		storedObject.nonce = nonce;

		if (this.parameters.storageType === "local") {
			return localStorage.setItem(this.localStorageKey, JSON.stringify(storedObject));
		} else if (this.parameters.storageType === "cookie") {
			return Cookies.set(this.localStorageKey, JSON.stringify(storedObject));
		} else {
			return false;
		}
	}

  makeNonce(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
  }

	getStoredData() {
		var storage;
		if (this.parameters.storageType === "local") {
			storage = JSON.parse(localStorage.getItem(this.localStorageKey));
			if (storage) {
				return storage;
			} else {
				return {};
			}
		} else if (this.parameters.storageType === "cookie") {
			storage = JSON.parse(Cookies.get(this.localStorageKey));
			if (storage) {
				return storage;
			} else {
				return {};
			}
		} else {
			return {};
		}
	}

	onChangeStatus(cb) {
		this.changeStatusCb.push(cb);
	}

	isTokenValid(token) {
		if (!!token) {
			var curDate = new Date();
			return ((token.iat + token.expires_in)*1000) > curDate.getTime();
		} else {
			return false;
		}
	}

	getRefreshTokenFromCode(code, cb) {
		$.ajax({
			type: "POST",
			url: this.parameters.tokenUrl,
			data: {grant_type: "authorization_code", client_id: this.parameters.clientId, redirect_uri: this.parameters.redirectUri, code: code},
			success: (result, status, request) => {
				cb(result);
			},
			error: (error) => {
				if (error.status === 403) {
					this.refreshToken = false;
				}
				this.accessToken = false;
				cb(false);
			}
		});
	}

	refreshTokenLoop(refreshToken, timeout) {
		clearTimeout(this.refreshTimeout);
		this.refreshTimeout = setTimeout(() => {
			this.executeRefreshToken(refreshToken, (res, token) => {
				if (res) {
					var curDate = new Date();
					var timeout = Math.floor(((token.iat + token.expires_in)*1000 - curDate.getTime())/1000);
					this.refreshTokenLoop(refreshToken, timeout);
				}
			});
		}, (timeout - 60)*1000);
	}

	runRefreshToken(cb) {
		if (this.getStoredData().refreshToken) {
			return this.executeRefreshToken(this.getStoredData().refreshToken, cb);
		} else {
      return new Promise((resolve, reject) => {
        reject("disconnected");
      });
		}
	}

	executeRefreshToken(refreshToken, cb) {
		return $.ajax({
			type: "POST",
			url: this.parameters.tokenUrl,
			data: {grant_type: "refresh_token", refresh_token: refreshToken},
			success: (result, status, request) => {
				this.accessToken = result.access_token;
				this.storeAccessToken(result);
				this.broadcastMessage("refresh", result.access_token, (result.iat + result.expires_in));
				if (cb) {
					cb(true, result);
				}
			},
			error: (error) => {
				if (error.status === 403) {
					this.refreshToken = false;
				}
				this.accessToken = false;
				if (error.readyState === 0) {
					this.broadcastMessage("network error");
				} else {
					this.broadcastMessage("disconnected");
				}
				if (cb) {
					cb(false);
				}
			}
		})
		.then((result) => {
			return {token: result.access_token, expiration: result.expires_in};
		});
	}

	broadcastMessage(status, token, expiration, profile) {
		for (var i in this.changeStatusCb) {
			this.changeStatusCb[i](status, token, expiration, profile);
		}
	}

	getConnectedProfile(cb) {
		if (this.parameters.userinfoUrl) {
			$.ajax({
				type: "GET",
				url: this.parameters.userinfoUrl,
				headers: {"Authorization": "Bearer " + this.accessToken.access_token},
				success: (result) => {
					if (cb) {
						cb(true, result)
					}
				},
				error: (error) => {
					if (cb) {
						cb(false)
					}
				}
			});
		} else {
			cb(false);
		}
	}

	connect() {
		var token = this.getStoredData();
		if (token && this.isTokenValid(token.accessToken)) {
			this.broadcastMessage("connected", token.accessToken.access_token, (token.accessToken.iat + token.accessToken.expires_in));
			this.getConnectedProfile((res, profile) => {
				if (res) {
					this.broadcastMessage("profile", profile);
				}
			});
		} else {
			token.accessToken = false;
      var nonce = this.makeNonce(16);
			this.storeAccessToken(false);
      this.storeNonce(nonce);
			if (this.parameters.responseType === "token") {
				document.location = this.parameters.authUrl + "?response_type=token&client_id=" + this.parameters.clientId + "&redirect_uri=" + this.parameters.redirectUri + "&scope=" + this.parameters.scope + "&nonce=" + nonce;
			} else if (this.parameters.responseType === "code") {
				document.location = this.parameters.authUrl + "?response_type=code&client_id=" + this.parameters.clientId + "&redirect_uri=" + this.parameters.redirectUri + "&scope=" + this.parameters.scope + "&nonce=" + nonce;
			}
		}
	}

	disconnect() {
		clearTimeout(this.refreshTimeout);
		if (this.parameters.storageType === "local") {
			localStorage.removeItem(this.localStorageKey);
		} else if (this.parameters.storageType === "cookie") {
			Cookies.remove(this.localStorageKey);
		}
		this.refreshToken = false;
		this.accessToken = false;
		this.broadcastMessage("disconnected");
	}
}

let oidcConnector = new OIDCConnector();

export default oidcConnector;
