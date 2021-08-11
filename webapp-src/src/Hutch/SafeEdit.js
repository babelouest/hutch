import React, { Component } from 'react';

import { generateSecret } from 'jose/util/generate_secret';
import { fromKeyLike } from 'jose/jwk/from_key_like';
import { EncryptJWT } from 'jose/jwt/encrypt';

import i18next from 'i18next';

import apiManager from '../lib/APIManager';
import messageDispatcher from '../lib/MessageDispatcher';
import Confirm from './Confirm';
import ModalSafeKeyPassword from './ModalSafeKeyPassword'
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
      curSafeKeyContainer: false,
      nextStep: false,
      removeSafeKeyMessage: false
    };
    
    this.saveSafe = this.saveSafe.bind(this);
    this.cancelEditSafe = this.cancelEditSafe.bind(this);
    this.addSafeKeyPassword = this.addSafeKeyPassword.bind(this);
    this.saveSafeKeyPassword = this.saveSafeKeyPassword.bind(this);
    this.removeSafeKey = this.removeSafeKey.bind(this);
    this.removeSafeKeyConfirm = this.removeSafeKeyConfirm.bind(this);
    this.editSafeKeyPassword = this.editSafeKeyPassword.bind(this);
    this.completeAddSafeKey = this.completeAddSafeKey.bind(this);
    this.unlockSafeCallback = this.unlockSafeCallback.bind(this);
    this.isSafeUnlockedClose = this.isSafeUnlockedClose.bind(this);
    
  }
  
  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  isSafeUnlockedClose() {
    return (this.state.safeContent[this.state.safe.name].keyList.length && this.state.safeContent[this.state.safe.name].lastUnlock + 600 < (Date.now()/1000));
  }
  
  editName(e) {
    var safe = this.state.safe;
    safe.name = e.target.value;
    this.setState({safe: safe});
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
    if (!safe.name) {
      $.snack("warning", i18next.t("safeNameMandatory"));
      this.setState({nameMandatory: true, namePresent: false});
    } else {
      if (this.state.editMode === 1) {
        var found = false;
        if (this.state.safeContent[safe.name]) {
          $.snack("warning", i18next.t("safeNamePresent"));
          found = true;
          this.setState({nameMandatory: false, namePresent: true});
        }
        if (!found) {
          apiManager.request(this.state.config.safe_endpoint, "POST", safe)
          .then(() => {
            messageDispatcher.sendMessage('App', {action: "saveSafe", safe: safe});
            $.snack("info", i18next.t("messageSaveSafe"));
          })
          .fail(() => {
            $.snack("warning", i18next.t("messageErrorSaveSafe"));
          });
          this.setState({nameMandatory: false, namePresent: false});
        }
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
  }
  
  cancelEditSafe() {
    messageDispatcher.sendMessage('App', {action: "nav", target: this.state.editMode===1?false:this.state.safe.name});
  }
  
  addSafeKeyPassword() {
    if (this.isSafeUnlockedClose()) {
      this.setState({nextStep: this.addSafeKeyPassword}, () => {
        var unlockSafeModal = new bootstrap.Modal(document.getElementById('modalUnlockSafe'), {
          keyboard: false
        });
        unlockSafeModal.show();
      });
    } else {
      this.setState({curSafeKeyContainer: false}, () => {
        var addSafeKeyModal = new bootstrap.Modal(document.getElementById('modalSafeKey'), {
          keyboard: false
        });
        addSafeKeyModal.show();
      });
    }
  }
  
  saveSafeKeyPassword(result, data) {
    var safeKeyModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#modalSafeKey'));
    safeKeyModal.hide();
    if (result) {
      var enc = new TextEncoder();
      var containerKey = enc.encode(data.password);
      if (!this.state.curSafeKeyContainer) {
        generateSecret(this.state.safe.alg_type, {extractable: true})
        .then((newKey) => {
          this.completeAddSafeKey(newKey, containerKey, data.newSafeKey);
        });
      } else {
        this.completeSetSafeKey(containerKey, data.newSafeKey);
      }
    }
  }
  
  completeAddSafeKey(key, containerKey, newSafeKey) {
    fromKeyLike(key)
    .then((exportedKey) => {
      fromKeyLike(containerKey)
      .then((pwdKey) => {
        var lockAlg = "PBES2-HS256+A128KW";
        if (this.state.safe.alg_type === "A192KW" || this.state.safe.alg_type === "A192GCMKW" || this.state.safe.alg_type === "PBES2-HS384+A192KW") {
          lockAlg = "PBES2-HS384+A192KW";
        } else if (this.state.safe.alg_type === "A256KW" || this.state.safe.alg_type === "A256GCMKW" || this.state.safe.alg_type === "PBES2-HS512+A256KW") {
          lockAlg = "PBES2-HS512+A256KW";
        }
        new EncryptJWT(exportedKey)
        .setProtectedHeader({alg: lockAlg, enc: this.state.safe.enc_type, sign_key: this.state.config.sign_thumb})
        .encrypt(containerKey)
        .then((jwt) => {
          newSafeKey.data = jwt;
          apiManager.request(this.state.config.safe_endpoint + "/" + this.state.safe.name + "/key", "POST", newSafeKey)
          .then(() => {
            messageDispatcher.sendMessage('App', {action: "updateSafeKey", safe: this.state.safe});
          });
        });
      });
    });
  }
  
  removeSafeKey(e, safeKey) {
    e.preventDefault();
    if (this.isSafeUnlockedClose()) {
      this.setState({nextStep: this.removeSafeKey}, () => {
        var unlockSafeModal = new bootstrap.Modal(document.getElementById('modalUnlockSafe'), {
          keyboard: false
        });
        unlockSafeModal.show();
      });
    } else {
      this.setState({curSafeKeyContainer: safeKey, removeSafeKeyMessage: i18next.t("removeSafeKeyMessage", {name: safeKey.display_name||safeKey.name})}, () => {
        var removeKeyModal = new bootstrap.Modal(document.getElementById('removeSafeKey'), {
          keyboard: false
        });
        removeKeyModal.show();
      })
    }
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
  
  editSafeKeyPassword(e, safeKey) {
    if (this.isSafeUnlockedClose()) {
      this.setState({nextStep: this.editSafeKeyPassword}, () => {
        var unlockSafeModal = new bootstrap.Modal(document.getElementById('modalUnlockSafe'), {
          keyboard: false
        });
        unlockSafeModal.show();
      });
    } else {
      this.setState({curSafeKeyContainer: safeKey}, () => {
        var addSafeKeyModal = new bootstrap.Modal(document.getElementById('modalSafeKey'), {
          keyboard: false
        });
        addSafeKeyModal.show();
      });
    }
  }
  
  completeSetSafeKey(containerKey, newSafeKey) {
    fromKeyLike(containerKey)
    .then((pwdKey) => {
      var lockAlg = "PBES2-HS256+A128KW";
      if (this.state.safe.alg_type === "A192KW" || this.state.safe.alg_type === "A192GCMKW" || this.state.safe.alg_type === "PBES2-HS384+A192KW") {
        lockAlg = "PBES2-HS384+A192KW";
      } else if (this.state.safe.alg_type === "A256KW" || this.state.safe.alg_type === "A256GCMKW" || this.state.safe.alg_type === "PBES2-HS512+A256KW") {
        lockAlg = "PBES2-HS512+A256KW";
      }
      new EncryptJWT(this.state.safe.key)
      .setProtectedHeader({alg: lockAlg, enc: this.state.safe.enc_type, sign_key: this.state.config.sign_thumb})
      .encrypt(containerKey)
      .then((jwt) => {
        newSafeKey.data = jwt;
        apiManager.request(this.state.config.safe_endpoint + "/" + this.state.safe.name + "/key/" + newSafeKey.name, "PUT", newSafeKey)
        .then(() => {
          messageDispatcher.sendMessage('App', {action: "setSafeKey", safe: this.state.safe, newSafeKey: newSafeKey});
        });
      });
    });
  }
  
  unlockSafeCallback(result) {
    var unlockSafeModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#modalUnlockSafe'));
    unlockSafeModal.hide();
    if (result) {
      messageDispatcher.sendMessage('App', {action: "unlockSafe", safe: this.state.safe, cb: () => {
        if (this.state.nextStep) {
          this.state.nextStep();
        }
      }});
    }
  }

	render() {
    var nameClass = "form-control", nameErrorJsx, safeKeyListJsx = [];
    if (this.state.nameMandatory) {
      nameClass += " is-invalid";
      nameErrorJsx =
        <div className="invalid-feedback">
          {i18next.t("safeNameMandatory")}
        </div>
    }
    if (this.state.namePresent) {
      nameClass += " is-invalid";
      nameErrorJsx =
        <div className="invalid-feedback">
          {i18next.t("safeNamePresent")}
        </div>
    }
    if (this.state.safeContent && this.state.safe && this.state.safeContent[this.state.safe.name]) {
      this.state.safeContent[this.state.safe.name].keyList.forEach((safeKey, index) => {
        safeKeyListJsx.push(
          <div className="input-group" key={index}>
            <div className="input-group-text">{safeKey.display_name||safeKey.name}</div>
            <div className="btn-group me-2" role="group">
              <button type="button" className="btn btn-secondary" onClick={(e) => this.editSafeKeyPassword(e, safeKey)}>
                <i className="fa fa-pencil" aria-hidden="true"></i>
              </button>
              <button type="button" className="btn btn-secondary" onClick={(e) => this.removeSafeKey(e, safeKey)}>
                <i className="fa fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        );
      });
    }
    return (
      <div>
        <form onSubmit={this.saveSafe}>
          <div className="mb-3">
            <label htmlFor="safeName" className="form-label">{i18next.t("safeName")}</label>
            <input disabled={this.state.editMode===2} type="text" className={nameClass} id="safeName" value={this.state.safe.name||""} onChange={(e) => this.editName(e)}/>
            {nameErrorJsx}
          </div>
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
                <button type="button" className="btn btn-success" onClick={this.addSafeKeyPassword} disabled={this.state.editMode===1}>
                  <i className="fa fa-plus" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
          <div className="mb-3">
            {safeKeyListJsx}
          </div>
          <div className="btn-toolbar justify-content-between" role="toolbar">
            <div className="btn-group" role="group" aria-label="First group">
              <button type="submit" className="btn btn-primary" onClick={this.saveSafe}>{i18next.t("profileSubmit")}</button>
              <button type="button" className="btn btn-secondary" onClick={this.cancelEditSafe}>{i18next.t("profileCancel")}</button>
            </div>
          </div>
        </form>
        <Confirm name={"removeSafeKey"} title={i18next.t("removeSafeKeyTitle")} message={i18next.t("removeSafeKeyMessage")} cb={this.removeSafeKeyConfirm} />
        <ModalSafeKeyPassword safeKey={this.state.curSafeKeyContainer} callback={this.saveSafeKeyPassword}/>
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
