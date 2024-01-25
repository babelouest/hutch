import React, { Component } from 'react';
import i18next from 'i18next';

import { jwtDecrypt, importJWK, decodeProtectedHeader } from 'jose-browser-runtime';

import JwkInput from './JwkInput';

import storage from '../lib/Storage';
import prfCommon from '../lib/PrfCommon';

function getPreferredKey(safeContent, safe) {
  var curKey = false;
  var localStorageKey = "hutchsafekey-"+safe.name;
  if (window.location.pathname !== "/") {
    localStorageKey += "-" + window.btoa(unescape(encodeURIComponent(window.location.pathname))).replace(/\=+$/m,'');
  }
  var curKeyName = storage.getValue(localStorageKey)
  if (curKeyName) {
    safeContent[safe.name] && safeContent[safe.name].keyList && safeContent[safe.name].keyList.forEach((key) => {
      if (key.name === curKeyName) {
        curKey = key;
      }
    });
  } else {
    if (safeContent && safe && safeContent[safe.name] && safeContent[safe.name].keyList) {
      safeContent[safe.name].keyList.forEach((key) => {
        if (!curKey && (key.type === "password" || key.type === "master-password" || key.type === "jwk")) {
          curKey = key;
        }
      });
    }
  }
  return curKey;
}

function base64ToArrayBuffer(base64) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

class ModalSafeUnlock extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      safe: props.safe,
      safeContent: props.safeContent,
      cb: props.cb,
      safeKey: getPreferredKey(props.safeContent, props.safe),
      safePassword: "",
      safePrefixPassword: "",
      safeKeyJwk: "",
      safeSecretError: false,
      keepUnlocked: false,
      unlockKeyName: this.getBrowserInfo(),
      prfResult: false,
      lockPolicy: 0,
      lockAfterTime: 0
    }

    this.closeModal = this.closeModal.bind(this);
    this.setSafeKey = this.setSafeKey.bind(this);
    this.toggleKeepUnlocked = this.toggleKeepUnlocked.bind(this);
    this.changeUnlockKeyName = this.changeUnlockKeyName.bind(this);
    this.editSafeKeyJwk = this.editSafeKeyJwk.bind(this);
    this.createPrfFromKey = this.createPrfFromKey.bind(this);
    this.toggleLockPolicy = this.toggleLockPolicy.bind(this);
    this.setLockAfter = this.setLockAfter.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    var newState = Object.assign({}, props);
    if (state.safe.name !== props.safe.name) {
      newState.safeKey = getPreferredKey(props.safeContent, props.safe);
    }
    return newState;
  }
  
  changePassword(e) {
    this.setState({safePassword: e.target.value});
  }
  
  changePrefixPassword(e) {
    this.setState({safePrefixPassword: e.target.value});
  }
  
  editSafeKeyJwk(safeKeyJwk) {
    this.setState({safeKeyJwk: safeKeyJwk});
  }
  
  toggleKeepUnlocked(e) {
    this.setState({keepUnlocked: !this.state.keepUnlocked});
  }
  
  changeUnlockKeyName(e) {
    this.setState({unlockKeyName: e.target.value});
  }
  
  setSafeKey(e, safeKey) {
    e.preventDefault();
    this.setState({safeKey: safeKey, safeSecretError: false, prfResult: false}, () => {
      var localStorageKey = "hutchsafekey-"+this.state.safe.name;
      if (window.location.pathname !== "/") {
        localStorageKey += "-" + window.btoa(unescape(encodeURIComponent(window.location.pathname))).replace(/\=+$/m,'');
      }
      storage.setValue(localStorageKey, safeKey.name);
    });
  }
  
  getBrowserInfo() {
    var ua = navigator.userAgent, tem, 
    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])){
      tem =  /\brv[ :]+(\d+)/g.exec(ua) || [];
      return 'IE '+(tem[1] || '');
    }
    if (M[1] === 'Chrome'){
      tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
      if(tem !== null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M = M[2]?[M[1], M[2]]:[navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i))!= null) {
      M.splice(1, 1, tem[1]);
    }
    return M.join(' ');
  }
  
  verifyKey(e) {
    e.preventDefault();
    if (this.state.safeKey) {
      if (this.state.safeKey.type === "password" || this.state.safeKey.type === "master-password") {
        let protectedHeader = decodeProtectedHeader(this.state.safeKey.data);
        if (["PBES2-HS256+A128KW", "PBES2-HS384+A192KW", "PBES2-HS512+A256KW"].indexOf(protectedHeader.alg) > -1) {
          var enc = new TextEncoder();
          jwtDecrypt(this.state.safeKey.data, enc.encode(this.state.safePrefixPassword+this.state.safePassword), {keyManagementAlgorithms: [protectedHeader.alg]})
          .then((result) => {
            this.setState({safeSecretError: false}, () => {
              importJWK(result.payload, this.state.safe.alg_type)
              .then((masterKey) => {
                this.setState({safePassword : "", safePrefixPassword: "", safeKeyJwk: "", safeSecretError: false}, () => {
                  this.state.cb(true, masterKey, this.state.lockPolicy, this.state.keepUnlocked, this.state.unlockKeyName, this.state.lockAfterTime, result.payload);
                });
              });
            });
          })
          .catch(() => {
            this.setState({safeSecretError: true});
          });
        } else {
          this.setState({safeSecretError: true});
        }
      } else if (this.state.safeKey.type === "jwk") {
        try {
          var parsedKey = JSON.parse(this.state.safeKeyJwk);
          let jwk = false;
          if (parsedKey.keys && parsedKey.keys.length) {
            jwk = parsedKey.keys[0];
          } else {
            jwk = parsedKey;
          }
          importJWK(jwk, jwk.alg)
          .then(decKey => {
            jwtDecrypt(this.state.safeKey.data, decKey)
            .then((result) => {
              this.setState({safeSecretError: false}, () => {
                importJWK(result.payload, this.state.safe.alg_type)
                .then((masterKey) => {
                  this.setState({safePassword : "", safePrefixPassword: "", safeKeyJwk: "", safeSecretError: false}, () => {
                    this.state.cb(true, masterKey, this.state.keepUnlocked, this.state.unlockKeyName, result.payload);
                  });
                });
              });
            })
            .catch(() => {
              this.setState({safeSecretError: true});
            });
          })
          .catch(() => {
            this.setState({safeSecretError: true});
          });
        } catch (e) {
          this.setState({safeSecretError: true});
        }
      } else if (this.state.safeKey.type === "prf") {
        if (!this.state.prfResult) {
          this.setState({safeSecretError: true});
        } else {
          let protectedHeader = decodeProtectedHeader(this.state.safeKey.data);
          if (["PBES2-HS256+A128KW", "PBES2-HS384+A192KW", "PBES2-HS512+A256KW"].indexOf(protectedHeader.alg) > -1) {
            jwtDecrypt(this.state.safeKey.data, new Uint8Array(this.state.prfResult), {keyManagementAlgorithms: [protectedHeader.alg]})
            .then((result) => {
              this.setState({safeSecretError: false}, () => {
                importJWK(result.payload, this.state.safe.alg_type)
                .then((masterKey) => {
                  this.setState({safePassword : "", safePrefixPassword: "", safeKeyJwk: "", safeSecretError: false, prfResult: false}, () => {
                    this.state.cb(true, masterKey, this.state.keepUnlocked, this.state.unlockKeyName, result.payload);
                  });
                });
              });
            })
            .catch(() => {
              this.setState({safeSecretError: true});
            });
          } else {
            this.setState({safeSecretError: true});
          }
        }
      }
    } else {
      this.setState({safeSecretError: true});
    }
  }

  closeModal(e, result) {
    this.setState({safePassword : "", safePrefixPassword: "", safeKeyJwk: "", safeSecretError: false, keepUnlocked: false}, () => {
      if (this.state.cb) {
        this.state.cb(result);
      }
    });
  }

  createPrfFromKey(e, prf) {
    let credentialDec = false, saltDec = false, headerSaltDec;
    let salt;
    try {
      headerSaltDec = base64ToArrayBuffer(prf.salt);
      credentialDec = base64ToArrayBuffer(prf.credential);
    } catch (e) {
      this.setState({safeSecretError: true});
    }
    if (this.state.safePrefixPassword) {
      var enc = new TextEncoder();
      let prfPrefixSaltEnc = enc.encode(this.state.safePrefixPassword);
      saltDec = new Uint8Array(prfPrefixSaltEnc.length + headerSaltDec.byteLength);
      saltDec.set(prfPrefixSaltEnc, 0);
      saltDec.set(new Uint8Array(headerSaltDec), prfPrefixSaltEnc.length);
    } else {
      saltDec = new Uint8Array(headerSaltDec);
    }
    if (credentialDec && saltDec) {
      prfCommon.createPrfFromKey(credentialDec, saltDec)
      .then(result => {
        this.setState({prfResult: result.prfResult}, () => {this.verifyKey(e)});
      })
      .catch(err => {
        this.setState({safeSecretError: true});
      });
    } else {
      this.setState({safeSecretError: true});
    }
  }

  toggleLockPolicy(e, value) {
    this.setState({lockPolicy: value, keepUnlocked: !!value});
  }

  setLockAfter(e, value) {
    e.preventDefault();
    this.setState({lockAfterTime: value});
  }

	render() {
    var keyListJsx = [], keyHeader = {prefixPassword: false, prf: false}, safeSecretErrorJsx, safePasswordClass = "form-control", keepUnlockedJsx, inputSecretJsx, prefixPasswordJsx, prfErrorJsx;
    if (this.state.safe && this.state.safeContent && this.state.safeContent[this.state.safe.name] && this.state.safeContent[this.state.safe.name].keyList) {
      if (this.state.safeKey.type === "password") {
        if (this.state.safeSecretError) {
          safePasswordClass += " is-invalid"
          safeSecretErrorJsx =
            <div className="invalid-feedback">
              {i18next.t("safeKeyError")}
            </div>
        }
        inputSecretJsx =
          <input type="password"
                 className={safePasswordClass}
                 autoComplete="new-password"
                 placeholder={i18next.t("safePassword")}
                 onChange={(e) => this.changePassword(e)}
                 autoFocus={true}
                 value={this.state.safePassword} />
      } else if (this.state.safeKey.type === "master-password") {
        if (this.state.safeSecretError) {
          safePasswordClass += " is-invalid"
          safeSecretErrorJsx =
            <div className="invalid-feedback">
              {i18next.t("safeKeyError")}
            </div>
        }
        if (this.state.safeKey && this.state.safeKey.data) {
          keyHeader = decodeProtectedHeader(this.state.safeKey.data);
        }
        if (keyHeader.prefixPassword) {
          prefixPasswordJsx =
            <input type="password"
                   className={safePasswordClass}
                   autoComplete="new-password"
                   placeholder={i18next.t("safePrefixPassword")}
                   onChange={(e) => this.changePrefixPassword(e)}
                   autoFocus={true}
                   value={this.state.safePrefixPassword} />
        }
        inputSecretJsx =
          <div>
            {prefixPasswordJsx}
            <input type="password"
                   className={safePasswordClass}
                   autoComplete="new-password"
                   placeholder={i18next.t("safePassword")}
                   onChange={(e) => this.changePassword(e)}
                   autoFocus={true}
                   value={this.state.safePassword} />
          </div>
      } else if (this.state.safeKey.type === "jwk") {
        inputSecretJsx = <JwkInput isError={this.state.safeSecretError} errorMessage={i18next.t("safeKeyError")} ph={i18next.t("safeKeyJwkPh")} cb={this.editSafeKeyJwk}/>
      } else if (this.state.safeKey.type === "prf") {
        if (this.state.safeSecretError) {
          safePasswordClass += " is-invalid"
          prfErrorJsx =
            <div className="mb-3">
              <span className="badge bg-danger">{i18next.t("safeKeyError")}</span>
            </div>
        } else if (this.state.prfResult) {
          prfErrorJsx =
            <div className="mb-3">
              <span className="badge bg-success">{i18next.t("prfAssertionSuccess")}</span>
            </div>
        }
        if (this.state.safeKey && this.state.safeKey.data) {
          keyHeader = decodeProtectedHeader(this.state.safeKey.data);
        }
        if (keyHeader.prefixPassword) {
          prefixPasswordJsx =
            <div className="mb-3">
              <input type="password"
                     className={safePasswordClass}
                     autoComplete="new-password"
                     placeholder={i18next.t("safePrefixPassword")}
                     onChange={(e) => this.changePrefixPassword(e)}
                     autoFocus={true}
                     value={this.state.safePrefixPassword} />
            </div>
        }
        inputSecretJsx = 
          <div>
            {prefixPasswordJsx}
            <div className="mb-3">
              <button type="button" className="btn btn-secondary" onClick={(e) => this.createPrfFromKey(e, keyHeader.prf)}>{i18next.t("prfCreateCredential")}</button>
            </div>
          </div>
      }
      this.state.safeContent[this.state.safe.name].keyList.forEach((safeKey, index) => {
        if (safeKey.type === "password" || safeKey.type === "master-password" || safeKey.type === "prf") {
          keyListJsx.push(
            <li key={index}><a className="dropdown-item" href="#" onClick={(e) => this.setSafeKey(e, safeKey)}>{safeKey.display_name||safeKey.name}</a></li>
          );
        } else if (safeKey.type === "jwk") {
          keyListJsx.push(
            <li key={index}><a className="dropdown-item" href="#" onClick={(e) => this.setSafeKey(e, safeKey)}>{safeKey.display_name||safeKey.name}</a></li>
          );
        }
      });
    }
    keepUnlockedJsx =
      <div>
        <div className="input-group mb-3">
          <div className="form-check">
            <label className="form-check-label">
              <input className="form-check-input" type="radio" value="lockAfter" onChange={(e) => this.toggleLockPolicy(e, 0)} checked={this.state.lockPolicy===0} />
              {i18next.t("lockAfter")}
            </label>
          </div>
        </div>
        <div className="input-group mb-3">
          <div className="input-group-prepend">
            <label className="input-group-text" htmlFor="lockAfterTime">
              {i18next.t("lockAfterTime")}
            </label>
          </div>
          <button className="btn btn-outline-secondary dropdown-toggle"
                  type="button"
                  id="lockAfterTime"
                  disabled={this.state.lockPolicy!==0}
                  data-bs-toggle="dropdown"
                  aria-expanded="false">
            {i18next.t("lockAfterTime"+this.state.lockAfterTime)}
          </button>
          <ul className="dropdown-menu">
            <li><a className="dropdown-item" href="#" onClick={(e) => this.setLockAfter(e, 0)}>{i18next.t("lockAfterTime0")}</a></li>
            <li><a className="dropdown-item" href="#" onClick={(e) => this.setLockAfter(e, 60)}>{i18next.t("lockAfterTime60")}</a></li>
            <li><a className="dropdown-item" href="#" onClick={(e) => this.setLockAfter(e, 300)}>{i18next.t("lockAfterTime300")}</a></li>
            <li><a className="dropdown-item" href="#" onClick={(e) => this.setLockAfter(e, 900)}>{i18next.t("lockAfterTime900")}</a></li>
            <li><a className="dropdown-item" href="#" onClick={(e) => this.setLockAfter(e, 3600)}>{i18next.t("lockAfterTime3600")}</a></li>
          </ul>
        </div>
        <div className="input-group mb-3">
          <div className="form-check">
            <label className="form-check-label">
              <input className="form-check-input" type="radio" value="keepUnlocked" onChange={(e) => this.toggleLockPolicy(e, 1)} checked={this.state.lockPolicy===1} />
              {i18next.t("keepUnlocked")}
            </label>
          </div>
        </div>
        <div className="mb-3">
          <input type="text"
                 className="form-control"
                 placeholder={this.getBrowserInfo()}
                 onChange={(e) => this.changeUnlockKeyName(e)}
                 disabled={this.state.lockPolicy!==1}
                 id="safeUnlockKeyName"
                 value={this.state.unlockKeyName} />
          <div className="form-text" htmlFor="safeUnlockKeyName">
            {i18next.t("safeUnlockKeyName")}
          </div>
        </div>
      </div>
		return (
      <div className="modal" tabIndex="-1" id="modalUnlockSafe">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{i18next.t("safeUnlockTitle")}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={(e) => this.closeModal(e, false)}></button>
            </div>
            <form onSubmit={this.verifyKey}>
              <div className="modal-body">
                <div className="input-group mb-3">
                  <div className="input-group-prepend">
                    <label className="input-group-text" htmlFor="safeKeySelect">
                      {i18next.t("safeKeySelect")}
                    </label>
                  </div>
                  <button className="btn btn-outline-secondary dropdown-toggle"
                          type="button"
                          id="safeKeySelect"
                          data-bs-toggle="dropdown"
                          aria-expanded="false">
                    {this.state.safeKey.display_name||this.state.safeKey.name}
                  </button>
                  <ul className="dropdown-menu">
                    {keyListJsx}
                  </ul>
                </div>
                <div className="input-group mb-3">
                  {inputSecretJsx}
                  {safeSecretErrorJsx}
                </div>
                {prfErrorJsx}
                {keepUnlockedJsx}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)}>{i18next.t("modalClose")}</button>
                <button type="submit" className="btn btn-primary" onClick={(e) => this.verifyKey(e)}>{i18next.t("modalOk")}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
		);
	}
}

export default ModalSafeUnlock;
