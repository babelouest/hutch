import React, { Component } from 'react';

import { importJWK, jwtVerify, calculateJwkThumbprint, generateSecret, exportJWK, EncryptJWT, jwtDecrypt, decodeProtectedHeader } from 'jose-browser-runtime';

import i18next from 'i18next';

import apiManager from '../lib/APIManager';
import messageDispatcher from '../lib/MessageDispatcher';
import routage from '../lib/Routage';
import storage from '../lib/Storage';
import Notification from '../lib/Notification';
import oidcConnector from '../lib/OIDCConnector';

import TopMenu from './TopMenu';
import Profile from './Profile';
import Safe from './Safe';
import Config from './Config';
import ModalGeneratePassword from './ModalGeneratePassword';
import ModalOfflineSafe from './ModalOfflineSafe';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      profile: false,
      hutchProfile: false,
      hasProfile: false,
      safeList: [],
      safeContent: {},
      iconList: [],
      curSafe: false,
      offlineSafe: false,
      addSafe: false,
      oidcStatus: "connecting",
      tokenTimeout: false,
      nav: "profile",
      oldNav: false,
      langChanged: false,
      editProfile: false,
      editSafeMode: 0, // 0: read, 1: add, 2: edit
      trustworthy: true,
      forceTrust: false,
      showModalGeneratePassword: false,
      showModalOfflineSafe: false,
      modalGeneratePasswordElement: {
        params: {
          type: "chars",
          lowercase: true,
          upprcase: true,
          numbers: true,
          special: true,
          spaces: true,
          noSimilarFollowingChars: false,
          passwordCharLength: 32,
          wordsNumber: 4,
          wordsLangsList: [i18next.language],
          wordSeparator: " "
        }
      }
    };

    routage.addChangeRouteCallback((route) => {
      this.gotoRoute(route);
    });

    messageDispatcher.subscribe('OIDC', (message) => {
      if (message.status === "disconnected") {
        this.setState({oidcStatus: message.status, safeList: [], safeContent: {}, curSafe: false});
        messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageDisconnected")});
      } else if (message.status === "connected" || message.status === "refresh") {
        var curDate = new Date();
        apiManager.setToken(message.token, (curDate.getTime()/1000)+message.expires_in);
        if (message.status === "connected") {
          messageDispatcher.sendMessage('Notification', {type: "success", message: i18next.t("messageConnected")});
        }
        var tokenTimeout = false;
        if (oidcConnector.getParameter("responseType").search("code") === -1) {
          clearTimeout(this.state.tokenTimeout);
          tokenTimeout = setTimeout(() => {
            messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageSessionTimeout"), autohide: false});
            this.setState({oidcStatus: "timeout"});
          }, message.expires_in*1000);
        }
        this.setState({oidcStatus: "connected", tokenTimeout: tokenTimeout});
      } else if (message.status === "profile") {
        if (message.profile == "error") {
          messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageProfileError")});
          this.setState({oidcStatus: "disconnected", safeList: [], safeContent: {}, curSafe: false});
        } else if (message.profile) {
          this.setState({profile: message.profile}, () => {
            this.getHutchProfile()
            .then(() => {
              this.getSafeList()
              .then(() => {
                this.gotoRoute(routage.getCurrentRoute());
              });
            })
            .catch(() => {
            });
          });
        }
      }

      this.setForceTrust = this.setForceTrust.bind(this);
    });

    messageDispatcher.subscribe('App', (message) => {
      if (message.action === "lang") {
        if (message.lang !== i18next.language) {
          i18next.changeLanguage(message.lang)
          .then(() => {
            this.setState({langChanged: true}, () => {
              apiManager.request("words-" + i18next.language + ".json")
              .then(words => {
                var config = this.state.config;
                config.wordsList = words;
                this.setState({config: config});
              });
            });
          });
        }
      } else if (message.action === "editProfile") {
        var hutchProfile = this.state.hutchProfile||{name:this.state.profile.name, message: "", picture: "", sign_kid: this.state.config.jwks.keys[0].kid};
        this.setState({nav: "profile", editProfile: true, hutchProfile: hutchProfile});
      } else if (message.action === "getProfile") {
        this.setState({nav: "profile", editProfile: false}, () => {
          this.getHutchProfile();
        });
      } else if (message.action === "resetProfile") {
        this.setState({nav: "profile", editProfile: false, hutchProfile: false, hasProfile: false, safeList: [], safeContent: {}, curSafe: false});
      } else if (message.action === "nav") {
        if (!message.target) {
          this.setState({nav: "profile", editProfile: false, curSafe: false});
        } else {
          this.state.safeList.forEach((safe) => {
            if (safe.name === message.target) {
              this.setState({nav: "safe", curSafe: safe, editSafeMode: 0});
            }
          });
        }
      } else if (message.action === "config") {
        if (this.state.nav === "config" && !!this.state.oldNav) {
          this.setState({nav: this.state.oldNav, oldNav: false});
        } else {
          this.setState({nav: "config", oldNav: this.state.nav});
        }
      } else if (message.action === "generate") {
        this.setState({showModalGeneratePassword: true}, () => {
          var modalGeneratePassword = new bootstrap.Modal(document.getElementById('modalGeneratePassword'), {
            keyboard: false
          });
          modalGeneratePassword.show();
        });
      } else if (message.action === "offline") {
        this.setState({showModalOfflineSafe: true}, () => {
          var offlineSafe = new bootstrap.Modal(document.getElementById('offlineSafe'), {
            keyboard: false
          });
          offlineSafe.show();
        });
      } else if (message.action === "addSafe") {
        this.setState({
          nav: "safe",
          curSafe: {
            name: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            display_name: "",
            offline: !!this.state.config.frontend.offline,
            enc_type: "A256GCM",
            alg_type: "A256GCMKW"
          },
          editSafeMode: 1
        });
      } else if (message.action === "loadSafe") {
        this.getSafe(message.target);
      } else if (message.action === "editSafe") {
        this.state.safeList.forEach((safe) => {
          if (safe.name === message.target) {
            this.setState({nav: "safe", curSafe: safe, editSafeMode: 2});
          }
        });
      } else if (message.action === "saveSafe") {
        var safeList = this.state.safeList;
        var safeContent = this.state.safeContent;
        var found = false;
        safeList.forEach((safe, index) => {
          if (safe.name === message.safe.name) {
            safeList[index] = message.safe;
            found = true;
          }
        });
        if (!found) {
          safeList.push(message.safe);
          safeContent[message.safe.name] = {
            keyList: [],
            coinList: [],
            unlockedCoinList: [],
            key: false
          };
        }
        routage.addRoute(message.safe.name);
        this.setState({safeList: safeList, safeContent: safeContent, nav: "safe", curSafe: message.safe, editSafeMode: 0});
      } else if (message.action === "removeSafe") {
        var safeList = this.state.safeList;
        var safeContent = this.state.safeContent;
        safeList.forEach((safe, index) => {
          if (safe.name === message.safe.name) {
            safeList.splice(index, 1);
          }
        });
        routage.addRoute("");
        delete(safeContent[message.safe.name]);
        this.setState({safeList: safeList, safeContent: safeContent, nav: "profile", editProfile: false});
      } else if (message.action === "updateSafeKey") {
        this.getSafeKeyList(message.safe.name)
        .then(() => {
          this.setState({nav: "safe", curSafe: message.safe, editSafeMode: 2});
        });
      } else if (message.action === "setSafeKey") {
        var safeContent = this.state.safeContent;
        if (!safeContent[message.target.name].key && message.key) {
          safeContent[message.target.name].key = message.key;
        }
        safeContent[message.target.name].extractableKey = message.masterkeyData;
        safeContent[message.target.name].lastUnlock = (message.key?Math.floor(Date.now() / 1000):0);
        if (!message.key) {
          if (message.removeStorage) {
            var localStorageKey = "hutchsafe-"+message.target.name;
            if (window.location.pathname !== "/") {
              localStorageKey += "-" + window.btoa(unescape(encodeURIComponent(window.location.pathname))).replace(/\=+$/m,'');
            }
            var keyStorageName = storage.getValue(localStorageKey);
            if (keyStorageName) {
              apiManager.request(this.state.config.safe_endpoint + "/" + message.target.name + "/key/" + keyStorageName.kid, "DELETE")
              .then(() => {
                var curSafeContent = this.state.safeContent;
                curSafeContent[message.target.name].keyList.forEach((key, index) => {
                  if (key.name === keyStorageName.kid) {
                    curSafeContent[message.target.name].keyList.splice(index, 1);
                  }
                });
                this.setState({safeContent: curSafeContent});
              })
              .catch((error) => {
                messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("messageErrorSaveSafeKey")});
              });
            }
            storage.removeValue(localStorageKey);
            safeContent[message.target.name].key = false;
            safeContent[message.target.name].extractableKey = false;
            safeContent[message.target.name].lastUnlock = 0;
          }
        } else {
          if (message.keepUnlocked) {
            var unlockAlg = "A128KW";
            if (message.target.alg_type === "A192KW" || message.target.alg_type === "A192GCMKW" || message.target.alg_type === "PBES2-HS384+A192KW") {
              unlockAlg = "A192KW";
            } else if (message.target.alg_type === "A256KW" || message.target.alg_type === "A256GCMKW" || message.target.alg_type === "PBES2-HS512+A256KW") {
              unlockAlg = "A256KW";
            }
            generateSecret(unlockAlg, {extractable: true})
            .then((unlockKey) => {
              var kid = Math.random().toString(36).substring(7);
              new EncryptJWT(message.masterkeyData)
              .setProtectedHeader({alg: unlockAlg, enc: message.target.enc_type, sign_key: this.state.config.sign_thumb, kid: kid})
              .encrypt(unlockKey)
              .then((jwt) => {
                var safeKey = {
                  name: kid,
                  display_name: message.unlockKeyName,
                  type: "browser",
                  data: jwt
                };
                var curSafeContent = this.state.safeContent;
                curSafeContent[message.target.name].keyList.push(safeKey);
                this.setState({safeContent: curSafeContent});
                apiManager.request(this.state.config.safe_endpoint + "/" + message.target.name + "/key", "POST", safeKey)
                .then(() => {
                  exportJWK(unlockKey)
                  .then((exportedUnlockKey) => {
                    exportedUnlockKey.kid = kid;
                    exportedUnlockKey.alg = unlockAlg;
                    var localStorageKey = "hutchsafe-"+message.target.name;
                    if (window.location.pathname !== "/") {
                      localStorageKey += "-" + window.btoa(unescape(encodeURIComponent(window.location.pathname))).replace(/\=+$/m,'');
                    }
                    storage.setValue(localStorageKey, exportedUnlockKey);
                  });
                });
              });
            });
          }
        }
        safeContent[message.target.name].unlockedCoinList = [];
        this.setState({safeContent: safeContent}, () => {
          this.unlockCoinList(message.target.name, this.state.safeContent[message.target.name].key);
          if (this.state.safeContent[message.target.name].extractableKey) {
            setTimeout(() => {
              var curSafeContent = this.state.safeContent;
              delete(curSafeContent[message.target.name].extractableKey);
              this.setState({safeContent: curSafeContent}, () => {
              });
            }, 600000);
          }
        });
      } else if (message.action === "unlockSafe") {
        var safeContent = this.state.safeContent;
        safeContent[message.safe.name].extractableKey = message.extractableKey;
        this.setState({safeContent: safeContent}, () => {
          setTimeout(() => {
            var curSafeContent = this.state.safeContent;
            delete(curSafeContent[message.safe.name].extractableKey);
            this.setState({safeContent: curSafeContent});
          }, 600000);
          if (safeContent[message.safe.name].unlockedCoinList.length !== safeContent[message.safe.name].coinList.length) {
            this.unlockCoinList(message.safe.name, this.state.safeContent[message.safe.name].key)
          }
        });
      } else if (message.action === "lockAllSafe") {
        this.state.safeList.forEach((safe) => {
          if (!safe.offline) {
            messageDispatcher.sendMessage('App', {action: "setSafeKey", target: safe, removeStorage: true, key: false});
          } else {
            messageDispatcher.sendMessage('App', {action: "removeSafe", safe: safe});
          }
        });
      } else if (message.action === "updateCoin") {
        var safeContent = this.state.safeContent, safeList = this.state.safeList;
        var added = false;
        safeContent[message.target.name].coinList.forEach((encCoin, index) => {
          if (encCoin.name === message.encCoin.name) {
            safeContent[message.target.name].coinList[index] = message.encCoin;
            added = true;
          }
        });
        if (added) {
          safeContent[message.target.name].unlockedCoinList.forEach((unlockedCoin, index) => {
            if (unlockedCoin.name === message.unlockedCoin.name) {
              safeContent[message.target.name].unlockedCoinList[index] = message.unlockedCoin;
            }
          });
        } else {
          safeContent[message.target.name].coinList.push(message.encCoin);
          safeContent[message.target.name].unlockedCoinList.push(message.unlockedCoin);
        }
        safeContent[message.target.name].unlockedCoinList.sort(this.compareCoin);
        if (message.target.offline) {
          safeList.forEach((safe, index) => {
            if (safe.name === message.target.name) {
              safe.updated = true;
              safeList[index] = safe;
            }
          });
        }
        this.setState({safeContent: safeContent, safeList: safeList}, () => {
          if (message.cb) {
            message.cb(message.encCoin.name);
          }
        });
      } else if (message.action === "removeCoin") {
        var safeContent = this.state.safeContent, safeList = this.state.safeList;
        safeContent[message.target.name].coinList.forEach((encCoin, index) => {
          if (encCoin.name === message.coin) {
            delete(safeContent[message.target.name].coinList[index]);
          }
        });
        safeContent[message.target.name].unlockedCoinList.forEach((unlockedCoin, index) => {
          if (unlockedCoin.name === message.coin) {
            delete(safeContent[message.target.name].unlockedCoinList[index]);
          }
        });
        if (message.target.offline) {
          safeList.forEach((safe, index) => {
            if (safe.name === message.target.name) {
              safe.updated = true;
              safeList[index] = safe;
            }
          });
        }
        this.setState({safeContent: safeContent, safeList: safeList});
      } else if (message.action === "sessionTimeout") {
        messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageSessionTimeout"), autohide: false});
        this.setState({oidcStatus: "timeout"});
      } else if (message.action === "addOfflineSafe") {
        let newSafeName = message.safeName+"-"+(Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5));
        let safeList = this.state.safeList, safeContent = this.state.safeContent, newSafe = {name: newSafeName, display_name: message.safeName, enc_type: false, alg_type: false, offline: true, updated: false};
        safeList.push(newSafe);
        let unlockedCoinList = [], mockCoinList = [];
        message.coinList.forEach((coin, index) => {
          unlockedCoinList.push({
            name: coin.name||"offline-" + index,
            data: coin
          });
          mockCoinList.push({
            name: coin.name||"offline-" + index,
            data: false,
            last_updated: coin.lastUpdated||Math.floor(Date.now() / 1000)
          });
        });
        safeContent[newSafeName] = {
          keyList: [],
          coinList: mockCoinList,
          unlockedCoinList: unlockedCoinList,
          key: false
        }
        routage.addRoute(newSafeName||"");
        this.setState({safeList: safeList, safeContent: safeContent, nav: "safe", curSafe: newSafe, editSafeMode: 0}, () => {
          messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("importOfflineComplete", {count: message.coinList.length, name: message.safeName})});
        });
      } else if (message.action === "offlineSafeExported") {
        let safeList = this.state.safeList;
        safeList.forEach((safe, index) => {
          if (safe.name === message.safeName) {
            safeList[index].updated = false;
          }
        });
        this.setState({safeList: safeList});
      }
    });

    apiManager.request("words-" + i18next.language + ".json")
    .then((words) => {
      var config = this.state.config;
      config.wordsList = words;
      this.setState({config: config});
    });

    apiManager.request("fonts/forkawesome-ful-list.json")
    .then((iconList) => {
      this.setState({iconList: iconList});
    });

    if (this.state.config.frontend.offline) {
      this.state.oidcStatus = "connected";
      this.state.hutchProfile = {
        name: "Myrddin",
        picture: "img/offline-mode.svg"
      };
      this.state.hasProfile = true;
    }

    this.getHutchProfile = this.getHutchProfile.bind(this);
    this.getSafeList = this.getSafeList.bind(this);
    this.getSafeKeyList = this.getSafeKeyList.bind(this);
    this.unlockCoinList = this.unlockCoinList.bind(this);
    this.gotoRoute = this.gotoRoute.bind(this);
    this.closeGenerateModal = this.closeGenerateModal.bind(this);
    this.manageSafeClose = this.manageSafeClose.bind(this);
  }

  gotoRoute(route) {
    if (route) {
      this.state.safeList.forEach((safe) => {
        if (safe.name === route) {
          this.setState({nav: "safe", curSafe: safe, editSafeMode: 0});
        }
      });
    } else {
      this.setState({nav: "profile", editProfile: false});
    }
  }

  getHutchProfile() {
    return apiManager.request(this.state.config.profile_endpoint)
    .then((profileJwt) => {
      var profileJwtContent = JSON.parse(atob(profileJwt.split(".")[1].replace(/-/g, '+').replace(/_/g, '/')));
      var signJwk = false;
      this.state.config.jwks.keys.forEach((jwk) => {
        if (jwk.kid === profileJwtContent.sign_kid) {
          signJwk = true;
          importJWK(jwk, jwk.alg)
          .then((pubkey) => {
            calculateJwkThumbprint(jwk)
            .then((thumbprint) => {
              jwtVerify(profileJwt, pubkey)
              .then((profile) => {
                apiManager.setSignJwk(pubkey);
                var config = this.state.config;
                config.sign_thumb = thumbprint;
                this.setState({config: config, hutchProfile: profile.payload, hasProfile: true});
              });
            });
          });
        }
      });
      if (!signJwk) {
        return $.Deferred().reject("invalid sign key");
      }
    })
    .fail((error) => {
      var newState = {hutchProfile: false, hasProfile: false};
      if (error.status === 404) {
        messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageNoProfile")});
      } else if (error.status === 401) {
        newState.oidcStatus = "disconnected";
        newState.safeList = [];
        newState.safeContent = {};
        newState.curSafe = false;
        messageDispatcher.sendMessage('Notification', {type: "danger", message: i18next.t("messageAuthorizationInvalid")});
      } else {
        newState.oidcStatus = "disconnected";
        newState.safeList = [];
        newState.safeContent = {};
        newState.curSafe = false;
        messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageProfileError")});
      }
      this.setState(newState);
    });
  }

  getSafeList() {
    return apiManager.requestSigned(this.state.config.safe_endpoint)
    .then((result) => {
      return this.setState({safeList: result.payload.list, trustworthy: true}, () => {
        this.state.safeList.forEach((safe) => {
          return apiManager.requestSigned(this.state.config.safe_endpoint + "/" + safe.name + "/key")
          .then((keyList) => {
            return apiManager.requestSigned(this.state.config.safe_endpoint + "/" + safe.name + "/coin")
            .then((coinList) => {
              var trustworthy = true;
              coinList.payload.list.forEach((coin) => {
                var coinHeader = decodeProtectedHeader(coin.data);
                if (coinHeader.sign_thumb !== this.state.config.sign_thumb) {
                  trustworthy = false;
                }
              });
              var safeContent = this.state.safeContent;
              safeContent[safe.name] = {
                keyList: keyList.payload.list,
                coinList: coinList.payload.list,
                unlockedCoinList: [],
                key: false,
                lastUnlock: 0
              };
              this.setState({safeContent: safeContent, trustworthy: (this.state.trustworthy && trustworthy)}, () => {
                var localStorageKey = "hutchsafe-"+safe.name;
                if (window.location.pathname !== "/") {
                  localStorageKey += "-" + window.btoa(unescape(encodeURIComponent(window.location.pathname))).replace(/\=+$/m,'');
                }
                var exportedUnlockKey = storage.getValue(localStorageKey);
                if (exportedUnlockKey) {
                  keyList.payload.list.forEach((safeKey) => {
                    if (safeKey.name === exportedUnlockKey.kid) {
                      importJWK(exportedUnlockKey, exportedUnlockKey.alg)
                      .then((unlockKey) => {
                        jwtDecrypt(safeKey.data, unlockKey)
                        .then((curSafeKeyJson) => {
                          importJWK(curSafeKeyJson.payload, safe.alg_type)
                          .then((curSafeKey) => {
                            var safeContent = this.state.safeContent;
                            safeContent[safe.name].key = curSafeKey;
                            this.setState({safeContent: safeContent}, () => {
                              this.unlockCoinList(safe.name, safeContent[safe.name].key);
                            });
                          });
                        });
                      });
                    }
                  });
                }
              });
            })
            .fail((error) => {
              console.error("getSafeCoins", error);
              messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageErrorCoinList")});
              this.setState({hutchProfile: false, hasProfile: false, safeList: [], safeContent: {}});
            });
          })
          .fail((error) => {
            console.error("getSafeKeys", error);
            messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageErrorKeyList")});
            this.setState({hutchProfile: false, hasProfile: false, safeList: [], safeContent: {}});
          });
        });
      });
    })
    .fail((error) => {
      console.error("getSafeList", error);
      messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageErrorSafeList")});
      this.setState({hutchProfile: false, hasProfile: false, safeList: [], safeContent: {}});
    });
  }
  
  getSafe(safeName) {
    return apiManager.requestSigned(this.state.config.safe_endpoint + "/" + safeName)
    .then((result) => {
      var safeList = this.state.safeList;
      safeList.forEach((safe, index) => {
        if (safe.name === safeName) {
          safeList[index] = result.payload;
        }
      });
      return this.setState({safeList: safeList}, () => {
        return apiManager.requestSigned(this.state.config.safe_endpoint + "/" + safeName + "/key")
        .then((keyList) => {
          return apiManager.requestSigned(this.state.config.safe_endpoint + "/" + safeName + "/coin")
          .then((coinList) => {
            var trustworthy = true;
            coinList.payload.list.forEach((coin) => {
              var coinHeader = decodeProtectedHeader(coin.data);
              if (coinHeader.sign_thumb !== this.state.config.sign_thumb) {
                trustworthy = false;
              }
            });
            var safeContent = this.state.safeContent;
            safeContent[safeName].keyList = keyList.payload.list;
            safeContent[safeName].coinList = coinList.payload.list;
            safeContent[safeName].unlockedCoinList = [];
            this.setState({safeContent: safeContent, trustworthy: (this.state.trustworthy && trustworthy)}, () => {
              this.unlockCoinList(safeName, safeContent[safeName].key);
              messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageSafeLoaded")});
            });
          })
          .fail((error) => {
            console.error("getSafeCoins", error);
            messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageErrorCoinList")});
            this.setState({hutchProfile: false, hasProfile: false, safeList: [], safeContent: {}});
          });
        })
        .fail((error) => {
          console.error("getSafeKeys", error);
          messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageErrorKeyList")});
          this.setState({hutchProfile: false, hasProfile: false, safeList: [], safeContent: {}});
        });
      });
    })
    .fail((error) => {
      console.error("getSafe", error);
      messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageErrorSafeList")});
      this.setState({hutchProfile: false, hasProfile: false, safeList: [], safeContent: {}});
    });
  }
  
  compareCoin( a, b ) {
    if ( a.data.displayName.toUpperCase() < b.data.displayName.toUpperCase() ){
      return -1;
    }
    if ( a.data.displayName.toUpperCase() > b.data.displayName.toUpperCase() ){
      return 1;
    }
    return 0;
  }

  unlockCoinList(safeName, key) {
    var safeContent = this.state.safeContent;
    if (key && (this.state.trustworthy || this.state.forceTrust)) {
      safeContent[safeName].coinList.forEach((encCoin, index) => {
        jwtDecrypt(encCoin.data, key)
        .then((decCoin) => {
          safeContent[safeName].unlockedCoinList.push({name: encCoin.name, data: decCoin.payload});
          if (index === safeContent[safeName].coinList.length-1) {
            safeContent[safeName].unlockedCoinList.sort(this.compareCoin);
            this.setState({safeContent: safeContent});
          }
        });
      });
    } else {
      safeContent[safeName].unlockedCoinList = [];
      this.setState({safeContent: safeContent});
    }
  }
  
  getSafeKeyList(safe) {
    return apiManager.requestSigned(this.state.config.safe_endpoint + "/" + safe + "/key")
    .then((keyList) => {
      var safeContent = this.state.safeContent;
      safeContent[safe].keyList = keyList.payload.list;
      this.setState({safeContent: safeContent});
    })
    .catch((error) => {
      messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageErrorKeyList")});
    });
  }

  setForceTrust() {
    this.setState({forceTrust: true}, () => {
      this.state.safeList.forEach((safe) => {
        if (this.state.safeContent[safe.name].key) {
          this.unlockCoinList(safe.name, this.state.safeContent[safe.name].key);
        }
      });
    });
  }

  closeGenerateModal() {
    var modalGeneratePassword = bootstrap.Modal.getOrCreateInstance(document.querySelector('#modalGeneratePassword'));
    modalGeneratePassword.hide();
    this.setState({showModalGeneratePassword: false});
  }
  
  manageSafeClose() {
    var offlineSafe = bootstrap.Modal.getOrCreateInstance(document.querySelector('#offlineSafe'));
    offlineSafe.hide();
    this.setState({showModalOfflineSafe: false});
  }

	render() {
    var bodyJsx, trustworthyJsx, forceTrustJsx;
    if (this.state.trustworthy || (!this.state.trustworthy && this.state.forceTrust)) {
      if (this.state.nav === "profile") {
        bodyJsx = <Profile config={this.state.config}
                           profile={this.state.profile}
                           hutchProfile={this.state.hutchProfile}
                           hasProfile={this.state.hasProfile}
                           editProfile={this.state.editProfile}
                           oidcStatus={this.state.oidcStatus} />
      } else if (this.state.nav === "safe") {
        bodyJsx = <Safe config={this.state.config}
                        hutchProfile={this.state.hutchProfile}
                        safe={this.state.curSafe}
                        safeContent={this.state.safeContent}
                        editMode={this.state.editSafeMode}
                        oidcStatus={this.state.oidcStatus}
                        iconList={this.state.iconList} />
      } else if (this.state.nav === "config") {
        bodyJsx = <Config config={this.state.config} />
      }
    }
    if (!this.state.trustworthy) {
      if (!this.state.forceTrust) {
        forceTrustJsx =
        <div>
          <div>
            {i18next.t("untrustworthyOpenMessage")}
          </div>
          <div>
            <button type="button" className="btn btn-secondary" onClick={this.setForceTrust}>{i18next.t("untrustworthyOpen")}</button>
          </div>
        </div>
      }
      trustworthyJsx =
        <div className="alert alert-danger text-center" role="alert">
          {i18next.t("untrustworthySafe")}
          {forceTrustJsx}
        </div>
    }
    var modalGenerate, modalOfflineSafe;
    if (this.state.showModalGeneratePassword) {
      modalGenerate = <ModalGeneratePassword config={this.state.config}
                                             element={this.state.modalGeneratePasswordElement}
                                             originalPassword={false}
                                             callback={this.closeGenerateModal}
                                             hideSaveAndClose={true} />
    }
    if (this.state.showModalOfflineSafe) {
      modalOfflineSafe = <ModalOfflineSafe config={this.state.config}
                                          safe={false}
                                          safeContent={false}
                                          cbSaveCoin={false}
                                          oidcStatus={false}
                                          cbClose={this.manageSafeClose} />
    }
    return (
      <div className="container-fluid">
        <TopMenu config={this.state.config}
                 oidcStatus={this.state.oidcStatus}
                 safeList={this.state.safeList}
                 safeContent={this.state.safeContent}
                 curSafe={this.state.curSafe}
                 hasProfile={this.state.hasProfile}/>
        {trustworthyJsx}
        {bodyJsx}
        <Notification loggedIn={this.state.oidcStatus}/>
        {modalGenerate}
        {modalOfflineSafe}
      </div>
    );
	}
}

export default App;
