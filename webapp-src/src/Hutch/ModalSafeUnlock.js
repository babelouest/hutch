import React, { Component } from 'react';
import i18next from 'i18next';

import { jwtDecrypt } from 'jose/jwt/decrypt';
import { parseJwk } from 'jose/jwk/parse'

import JwkInput from './JwkInput';

import storage from '../lib/Storage';

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

class ModalSafeUnlock extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      safe: props.safe,
      safeContent: props.safeContent,
      cb: props.cb,
      allowKeepUnlocked: props.allowKeepUnlocked,
      safeKey: getPreferredKey(props.safeContent, props.safe),
      safePassword: "",
      safeKeyJwk: "",
      safeSecretError: false,
      keepUnlocked: false,
      unlockKeyName: this.getBrowserInfo()
    }

    this.closeModal = this.closeModal.bind(this);
    this.setSafeKey = this.setSafeKey.bind(this);
    this.toggleKeepUnlocked = this.toggleKeepUnlocked.bind(this);
    this.changeUnlockKeyName = this.changeUnlockKeyName.bind(this);
    this.editSafeKeyJwk = this.editSafeKeyJwk.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    var newState = Object.assign({}, props);
    if (!state.safeKey) {
      newState.safeKey = getPreferredKey(props.safeContent, props.safe)
    }
    return newState;
  }
  
  changePassword(e) {
    this.setState({safePassword: e.target.value});
  }
  
  editSafeKeyJwk(safeKeyJwk) {
    this.setState({safeKeyJwk: safeKeyJwk});
  }
  
  toggleKeepUnlocked(e) {
    var newKeepUnlocked = !this.state.keepUnlocked;
    this.setState({keepUnlocked: newKeepUnlocked});
  }
  
  changeUnlockKeyName(e) {
    this.setState({unlockKeyName: e.target.value});
  }
  
  setSafeKey(e, safeKey) {
    e.preventDefault();
    this.setState({safeKey: safeKey, safeSecretError: false}, () => {
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
        var enc = new TextEncoder();
        jwtDecrypt(this.state.safeKey.data, enc.encode(this.state.safePassword))
        .then((result) => {
          this.setState({safeSecretError: false}, () => {
            parseJwk(result.payload, this.state.safe.alg_type)
            .then((masterKey) => {
              this.state.cb(true, masterKey, this.state.keepUnlocked, this.state.unlockKeyName, result.payload);
            });
          });
        })
        .catch(() => {
          this.setState({safeSecretError: true});
        });
      } else if (this.state.safeKey.type === "jwk") {
        try {
          var parsedKey = JSON.parse(this.state.safeKeyJwk);
          parseJwk(parsedKey, parsedKey.alg)
          .then(decKey => {
            jwtDecrypt(this.state.safeKey.data, decKey)
            .then((result) => {
              this.setState({safeSecretError: false}, () => {
                parseJwk(result.payload, this.state.safe.alg_type)
                .then((masterKey) => {
                  this.state.cb(true, masterKey, this.state.keepUnlocked, this.state.unlockKeyName, result.payload);
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
      }
    } else {
      this.setState({safeSecretError: true});
    }
  }

  closeModal(e, result) {
    if (this.state.cb) {
      this.state.cb(result);
    }
  }

	render() {
    var keyListJsx = [], safeSecretErrorJsx, safePasswordClass = "form-control", keepUnlockedJsx, inputSecretJsx;
    if (this.state.safe && this.state.safeContent && this.state.safeContent[this.state.safe.name] && this.state.safeContent[this.state.safe.name].keyList) {
      if (this.state.safeKey.type === "password" || this.state.safeKey.type === "master-password") {
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
                 autoComplete="off"
                 placeholder={i18next.t("safePassword")}
                 onChange={(e) => this.changePassword(e)}
                 value={this.state.safePassword} />
      } else if (this.state.safeKey.type === "jwk") {
        inputSecretJsx = <JwkInput isError={this.state.safeSecretError} errorMessage={i18next.t("safeKeyError")} ph={i18next.t("safeKeyJwkPh")} cb={this.editSafeKeyJwk}/>
      }
      this.state.safeContent[this.state.safe.name].keyList.forEach((safeKey, index) => {
        if (safeKey.type === "password" || safeKey.type === "master-password") {
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
    if (this.state.allowKeepUnlocked) {
      keepUnlockedJsx =
        <div>
          <div className="form-check">
            <input className="form-check-input" type="checkbox" checked={this.state.keepUnlocked} id="keepUnlocked" onChange={(e) => this.toggleKeepUnlocked(e)} />
            <label className="form-check-label" htmlFor="keepUnlocked">
              {i18next.t("keepUnlocked")}
            </label>
          </div>
          <div className="mb-3">
            <input type="text"
                   className="form-control"
                   placeholder={this.getBrowserInfo()}
                   onChange={(e) => this.changeUnlockKeyName(e)}
                   disabled={!this.state.keepUnlocked}
                   id="safeUnlockKeyName"
                   value={this.state.unlockKeyName} />
            <div className="form-text" htmlFor="safeUnlockKeyName">
              {i18next.t("safeUnlockKeyName")}
            </div>
          </div>
        </div>
    }
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
