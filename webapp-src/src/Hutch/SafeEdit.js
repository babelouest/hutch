import React, { Component } from 'react';

import { generateSecret } from 'jose-browser-runtime/util/generate_secret';
import { fromKeyLike } from 'jose-browser-runtime/jwk/from_key_like';
import { EncryptJWT } from 'jose-browser-runtime/jwt/encrypt';
import { parseJwk } from 'jose-browser-runtime/jwk/parse';

import i18next from 'i18next';

import apiManager from '../lib/APIManager';
import messageDispatcher from '../lib/MessageDispatcher';
import Confirm from './Confirm';
import ModalSafeKey from './ModalSafeKey'
import ModalSafeUnlock from './ModalSafeUnlock';

class SafeEdit extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      safe: props.safe,
      safeContent: props.safeContent,
      editMode: props.editMode, // 0: read, 1: add, 2: edit
      nameMandatory: false,
      namePresent: false,
      safeKey: props.safeKey,
      addKey: false,
      curSafeKeyContainer: false,
      nextStep: false,
      removeSafeKeyMessage: false
    };
    
    this.saveSafe = this.saveSafe.bind(this);
    this.cancelEditSafe = this.cancelEditSafe.bind(this);
    this.addSafeKey = this.addSafeKey.bind(this);
    this.saveSafeKey = this.saveSafeKey.bind(this);
    this.removeSafeKey = this.removeSafeKey.bind(this);
    this.removeSafeKeyConfirm = this.removeSafeKeyConfirm.bind(this);
    this.editSafeKey = this.editSafeKey.bind(this);
    this.completeAddSafeKey = this.completeAddSafeKey.bind(this);
    this.completeSetSafeKey = this.completeSetSafeKey.bind(this);
    this.unlockSafeCallback = this.unlockSafeCallback.bind(this);
    this.createKeyForSafe = this.createKeyForSafe.bind(this);
    
  }
  
  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  editDisplayName(e) {
    var safe = this.state.safe;
    safe.display_name = e.target.value;
    this.setState({safe: safe});
  }

  editEncType(e) {
    var safe = this.state.safe;
    safe.enc_type = e.target.value;
    this.setState({safe: safe});
  }

  editAlgType(e) {
    var safe = this.state.safe;
    safe.alg_type = e.target.value;
    this.setState({safe: safe});
  }
  
  saveSafe(e) {
    e.preventDefault();
    var safe = this.state.safe;
    if (this.state.editMode === 1) {
      apiManager.request(this.state.config.safe_endpoint, "POST", safe)
      .then(() => {
        messageDispatcher.sendMessage('App', {action: "saveSafe", safe: safe});
        $.snack("info", i18next.t("messageSaveSafe"));
      })
      .fail(() => {
        $.snack("warning", i18next.t("messageErrorSaveSafe"));
      });
      this.setState({nameMandatory: false, namePresent: false});
    } else {
      apiManager.request(this.state.config.safe_endpoint + "/" + safe.name, "PUT", safe)
      .then(() => {
        messageDispatcher.sendMessage('App', {action: "saveSafe", safe: safe});
        $.snack("info", i18next.t("messageSaveSafe"));
      })
      .fail(() => {
        $.snack("warning", i18next.t("messageErrorSaveSafe"));
      });
    }
  }
  
  cancelEditSafe() {
    messageDispatcher.sendMessage('App', {action: "nav", target: this.state.editMode===1?false:this.state.safe.name});
  }
  
  createKeyForSafe() {
    return generateSecret(this.state.safe.alg_type, {extractable: true})
    .then((newKey) => {
      return fromKeyLike(newKey)
      .then((extractableKey) => {
        return parseJwk(extractableKey, this.state.safe.alg_type)
        .then((key) => {
          return {key: key, extractableKey: extractableKey};
          setTimeout(() => {
            var curSafeContent = this.state.safeContent;
            delete(curSafeContent[this.state.safe.name].extractableKey);
            this.setState({safeContent: curSafeContent});
          }, 600000);
        });
      });
    });
  }
  
  saveSafeKey(result, data) {
    var safeKeyModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#modalSafeKey'));
    safeKeyModal.hide();
    if (result) {
      if (data.safeKey.type === "password" || data.safeKey.type === "master-password") {
        var lockAlg = "PBES2-HS256+A128KW";
        if (this.state.safe.alg_type === "A192KW" || this.state.safe.alg_type === "A192GCMKW" || this.state.safe.alg_type === "PBES2-HS384+A192KW") {
          lockAlg = "PBES2-HS384+A192KW";
        } else if (this.state.safe.alg_type === "A256KW" || this.state.safe.alg_type === "A256GCMKW" || this.state.safe.alg_type === "PBES2-HS512+A256KW") {
          lockAlg = "PBES2-HS512+A256KW";
        }
        var enc = new TextEncoder();
        var containerKey = enc.encode(data.password);
        if (this.state.addKey) {
          if (!this.state.safeContent[this.state.safe.name].key) {
            this.createKeyForSafe()
            .then((keyData) => {
              var curSafeContent = this.state.safeContent;
              curSafeContent[this.state.safe.name].extractableKey = keyData.extractableKey;
              curSafeContent[this.state.safe.name].key = keyData.key;
              this.setState({safeContent: curSafeContent}, () => {
                this.completeAddSafeKey(containerKey, data.safeKey, lockAlg);
              });
            });
          } else {
            this.completeAddSafeKey(containerKey, data.safeKey, lockAlg);
          }
        } else {
          this.completeSetSafeKey(containerKey, data.safeKey, lockAlg);
        }
      } else if (data.safeKey.type === "jwk") {
        if (this.state.addKey) {
          if (!this.state.safeContent[this.state.safe.name].key) {
            this.createKeyForSafe()
            .then((keyData) => {
              var curSafeContent = this.state.safeContent;
              curSafeContent[this.state.safe.name].extractableKey = keyData.extractableKey;
              curSafeContent[this.state.safe.name].key = keyData.key;
              this.setState({safeContent: curSafeContent}, () => {
                parseJwk(data.jwk, data.jwk.alg)
                .then(containerKey => {
                  this.completeAddSafeKey(containerKey, data.safeKey, data.jwk.alg);
                });
              });
            });
          } else {
            parseJwk(data.jwk, data.jwk.alg)
            .then(containerKey => {
              this.completeAddSafeKey(containerKey, data.safeKey, data.jwk.alg);
            });
          }
        } else {
          parseJwk(data.jwk, data.jwk.alg)
          .then(containerKey => {
            this.completeSetSafeKey(containerKey, data.safeKey, data.jwk.alg);
          });
        }
      } else if (data.safeKey.type === "browser") {
        apiManager.request(this.state.config.safe_endpoint + "/" + this.state.safe.name + "/key/" + data.safeKey.name, "PUT", data.safeKey)
        .then(() => {
          messageDispatcher.sendMessage('App', {action: "setSafeKey", target: this.state.safe, newSafeKey: data.safeKey, removeStorage: false});
          this.setState({curSafeKeyContainer: false});
          $.snack("info", i18next.t("safeLockUpdated"));
        });
      }
    }
  }
  
  addSafeKey(e, type) {
    e.preventDefault();
    if (!this.state.safeContent[this.state.safe.name].extractableKey && this.state.safeContent[this.state.safe.name].keyList.length) {
      this.setState({nextStep: this.addSafeKey}, () => {
        var unlockSafeModal = new bootstrap.Modal(document.getElementById('modalUnlockSafe'), {
          keyboard: false
        });
        unlockSafeModal.show();
      });
    } else {
      this.setState({addKey: true, curSafeKeyContainer: {name: (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
                                                         display_name: "",
                                                         type: type,
                                                         data: ""}}, () => {
        var addSafeKeyModal = new bootstrap.Modal(document.getElementById('modalSafeKey'), {
          keyboard: false
        });
        addSafeKeyModal.show();
      });
    }
  }
  
  completeAddSafeKey(containerKey, newSafeKey, alg) {
    if (this.state.safeContent[this.state.safe.name].extractableKey) {
      new EncryptJWT(this.state.safeContent[this.state.safe.name].extractableKey)
      .setProtectedHeader({alg: alg, enc: this.state.safe.enc_type, sign_key: this.state.config.sign_thumb})
      .encrypt(containerKey)
      .then((jwt) => {
        newSafeKey.data = jwt;
        apiManager.request(this.state.config.safe_endpoint + "/" + this.state.safe.name + "/key", "POST", newSafeKey)
        .then(() => {
          messageDispatcher.sendMessage('App', {action: "updateSafeKey", safe: this.state.safe});
          $.snack("info", i18next.t("safeLockAdded"));
        });
      });
    } else {
      $.snack("warning", i18next.t("lockedSafe"));
    }
  }
  
  editSafeKey(e, safeKey) {
    var newState = {addKey: false};
    if (safeKey) {
      newState.curSafeKeyContainer = safeKey;
    }
    this.setState(newState, () => {
      if (!this.state.safeContent[this.state.safe.name].extractableKey) {
        this.setState({nextStep: this.editSafeKey}, () => {
          var unlockSafeModal = new bootstrap.Modal(document.getElementById('modalUnlockSafe'), {
            keyboard: false
          });
          unlockSafeModal.show();
        });
      } else {
          var addSafeKeyModal = new bootstrap.Modal(document.getElementById('modalSafeKey'), {
            keyboard: false
          });
          addSafeKeyModal.show();
      }
    });
  }
  
  completeSetSafeKey(containerKey, newSafeKey, alg) {
    if (this.state.safeContent[this.state.safe.name].extractableKey) {
      new EncryptJWT(this.state.safeContent[this.state.safe.name].extractableKey)
      .setProtectedHeader({alg: alg, enc: this.state.safe.enc_type, sign_key: this.state.config.sign_thumb})
      .encrypt(containerKey)
      .then((jwt) => {
        newSafeKey.data = jwt;
        apiManager.request(this.state.config.safe_endpoint + "/" + this.state.safe.name + "/key/" + newSafeKey.name, "PUT", newSafeKey)
        .then(() => {
          messageDispatcher.sendMessage('App', {action: "setSafeKey", target: this.state.safe, newSafeKey: newSafeKey, removeStorage: false});
          this.setState({curSafeKeyContainer: false});
          $.snack("info", i18next.t("safeLockUpdated"));
        });
      });
    } else {
      $.snack("warning", i18next.t("lockedSafe"));
    }
  }
  
  removeSafeKey(e, safeKey) {
    e && e.preventDefault();
    var newState = {};
    if (safeKey) {
      newState.curSafeKeyContainer = safeKey;
      newState.removeSafeKeyMessage = i18next.t("removeSafeKeyMessage", {name: safeKey.display_name});
    }
    this.setState(newState, () => {
      if (!this.state.safeContent[this.state.safe.name].extractableKey) {
        this.setState({nextStep: this.removeSafeKey}, () => {
          var unlockSafeModal = new bootstrap.Modal(document.getElementById('modalUnlockSafe'), {
            keyboard: false
          });
          unlockSafeModal.show();
        });
      } else {
          var removeKeyModal = new bootstrap.Modal(document.getElementById('removeSafeKey'), {
            keyboard: false
          });
          removeKeyModal.show();
      }
    });
  }
  
  removeSafeKeyConfirm(result) {
    if (result) {
      apiManager.request(this.state.config.safe_endpoint + "/" + this.state.safe.name + "/key/" + this.state.curSafeKeyContainer.name, "DELETE")
      .then(() => {
        this.setState({curSafeKeyContainer: false}, () => {
          $.snack("info", i18next.t("messageRemoveSafeKey"));
          messageDispatcher.sendMessage('App', {action: "updateSafeKey", safe: this.state.safe});
        });
      })
      .fail(() => {
        $.snack("warning", i18next.t("messageErrorSaveSafeKey"));
      });
    }
    var removeKeyModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#removeSafeKey'));
    removeKeyModal.hide();
  }
  
  unlockSafeCallback(result, masterKey, keepUnlocked, unlockKeyName, masterkeyData) {
    var unlockSafeModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#modalUnlockSafe'));
    unlockSafeModal.hide();
    if (result) {
      messageDispatcher.sendMessage('App', {action: "unlockSafe", safe: this.state.safe, extractableKey: masterkeyData});
      if (this.state.nextStep) {
        this.state.nextStep();
      }
    }
  }

	render() {
    var safeKeyListJsx = [], modalSafeKeyJsx;
    if (this.state.safeContent && this.state.safe && this.state.safeContent[this.state.safe.name]) {
      var hasEditableSafeKey = 0;
      this.state.safeContent[this.state.safe.name].keyList.forEach(safeKey => {
        if (["password","master-password"].indexOf(safeKey.type) !== -1) {
          hasEditableSafeKey++;
        }
      });
      this.state.safeContent[this.state.safe.name].keyList.forEach((safeKey, index) => {
        var faIcon = "fa btn-icon ";
        if (safeKey.type === "password") {
          faIcon += "fa-key";
        } else if (safeKey.type === "master-password") {
          faIcon += "fa-unlock";
        } else if (safeKey.type === "jwk") {
          faIcon += "fa-file-code-o";
        } else if (safeKey.type === "browser") {
          faIcon += "fa-firefox";
        }
        safeKeyListJsx.push(
          <div className="input-group" key={index}>
            <div className="input-group-text">
              <i className={faIcon} aria-hidden="true"></i>
              {safeKey.display_name||safeKey.name}
            </div>
            <div className="btn-group me-2" role="group">
              <button type="button" className="btn btn-secondary" onClick={(e) => this.editSafeKey(e, safeKey)}>
                <i className="fa fa-pencil" aria-hidden="true"></i>
              </button>
              <button type="button" className="btn btn-secondary" onClick={(e) => this.removeSafeKey(e, safeKey)} disabled={hasEditableSafeKey<=1 && ["password","master-password"].indexOf(safeKey.type) !== -1}>
                <i className="fa fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        );
      });
    }
    if (this.state.curSafeKeyContainer) {
      modalSafeKeyJsx = <ModalSafeKey safeKey={this.state.curSafeKeyContainer} callback={this.saveSafeKey}/>
    }
    return (
      <div>
        <form onSubmit={this.saveSafe}>
          <input type="hidden" id="safeName" value={this.state.safe.name}/>
          <div className="mb-3">
            <label htmlFor="safeDisplayName" className="form-label">{i18next.t("safeDisplayName")}</label>
            <input type="text" className="form-control" id="safeDisplayName" value={this.state.safe.display_name||""} onChange={(e) => this.editDisplayName(e)}/>
          </div>
          <div className="mb-3">
            <label htmlFor="encType" className="form-label">{i18next.t("safeEncType")}</label>
            <select disabled={this.state.editMode===2} className="form-select" aria-label="enc type" id="encType" onChange={(e) => this.editEncType(e)} value={this.state.safe.enc_type}>
              <option value="A128CBC-HS256">A128CBC-HS256</option>
              <option value="A192CBC-HS384">A192CBC-HS384</option>
              <option value="A256CBC-HS512">A256CBC-HS512</option>
              <option value="A128GCM">A128GCM</option>
              <option value="A192GCM">A192GCM</option>
              <option value="A256GCM">A256GCM</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="algType" className="form-label">{i18next.t("safeAlgType")}</label>
            <select disabled={this.state.editMode===2} className="form-select" aria-label="enc type" id="algType" onChange={(e) => this.editAlgType(e)} value={this.state.safe.alg_type}>
              <option value="A128KW">A128KW</option>
              <option value="A192KW">A192KW</option>
              <option value="A256KW">A256KW</option>
              <option value="A128GCMKW">A128GCMKW</option>
              <option value="A192GCMKW">A192GCMKW</option>
              <option value="A256GCMKW">A256GCMKW</option>
              <option value="PBES2-HS256+A128KW">PBES2-HS256+A128KW</option>
              <option value="PBES2-HS384+A192KW">PBES2-HS384+A192KW</option>
              <option value="PBES2-HS512+A256KW">PBES2-HS512+A256KW</option>
            </select>
          </div>
          <div className="alert alert-primary" role="alert">
            <div className="btn-toolbar justify-content-between" role="toolbar">
              {i18next.t("safeKeyList")}
              <div className="input-group">
                <div className="input-group mb-3">
                  <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className="fa fa-plus" aria-hidden="true"></i>
                  </button>
                  <ul className="dropdown-menu">
                    <a className="dropdown-item" href="#" onClick={(e) => this.addSafeKey(e, "password")}>{i18next.t("securityTypePassword")}</a>
                    <a className="dropdown-item" href="#" onClick={(e) => this.addSafeKey(e, "master-password")}>{i18next.t("securityTypeMasterPassword")}</a>
                    <a className="dropdown-item" href="#" onClick={(e) => this.addSafeKey(e, "jwk")}>{i18next.t("securityTypeJwk")}</a>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="btn-toolbar mb-3" role="toolbar">
            {safeKeyListJsx}
          </div>
          <div className="btn-toolbar justify-content-between" role="toolbar">
            <div className="btn-group" role="group" aria-label="First group">
              <button type="submit" className="btn btn-primary" onClick={this.saveSafe}>{i18next.t("profileSubmit")}</button>
              <button type="button" className="btn btn-secondary" onClick={this.cancelEditSafe}>{i18next.t("profileCancel")}</button>
            </div>
          </div>
        </form>
        <Confirm name={"removeSafeKey"} title={i18next.t("removeSafeKeyTitle")} message={this.state.removeSafeKeyMessage} cb={this.removeSafeKeyConfirm} />
        {modalSafeKeyJsx}
        <ModalSafeUnlock config={this.state.config}
                         safe={this.state.safe}
                         safeContent={this.state.safeContent}
                         allowKeepUnlocked={false}
                         cb={this.unlockSafeCallback} />
      </div>
    );
	}
}

export default SafeEdit;
