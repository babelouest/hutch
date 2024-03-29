import React, { Component } from 'react';
import i18next from 'i18next';

import JwkInput from './JwkInput';
import prfCommon from '../lib/PrfCommon';

class ModalSafeKey extends Component {
  constructor(props) {
    super(props);

    this.state = {
      profile: props.profile,
      safeKey: props.safeKey,
      cb: props.callback,
      newPassword: "",
      confirmNewPassword: "",
      prefixPassword: "",
      confirmPrefixPassword: "",
      safeKeyJwk: "",
      keyName: "",
      pwdScore: -1,
      isValid: false,
      prfStep: 0,
      prfError: false,
      prfCredential: false,
      prfPrefixSalt: "",
      prfPrefixSaltConfirm: "",
      prfSalt: false,
      prfResult: false
    }

    this.changeNewPassword = this.changeNewPassword.bind(this);
    this.changeConfirmNewPassword = this.changeConfirmNewPassword.bind(this);
    this.changePrefixPassword = this.changePrefixPassword.bind(this);
    this.changeConfirmPrefixPassword = this.changeConfirmPrefixPassword.bind(this);
    this.editSafeKeyJwk = this.editSafeKeyJwk.bind(this);
    this.createPrfCredential = this.createPrfCredential.bind(this);
    this.createPrfFromKey = this.createPrfFromKey.bind(this);
    this.changePrfPrefixSalt = this.changePrfPrefixSalt.bind(this);
    this.changeConfirmPrfPrefixSaltConfirm = this.changeConfirmPrfPrefixSaltConfirm.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

  changeDisplayName(e) {
    var safeKey = this.state.safeKey;
    safeKey.display_name = e.target.value;
    this.setState({safeKey: safeKey}, () => {this.isSafeKeyValid()});
  }

  changeNewPassword(e) {
    var pwdScore = -1;
    if (e.target.value) {
      pwdScore = zxcvbn(e.target.value).score;
    }
    this.setState({newPassword: e.target.value, pwdScore: pwdScore}, () => {this.isSafeKeyValid()});
  }

  changeConfirmNewPassword(e) {
    this.setState({confirmNewPassword: e.target.value}, () => {this.isSafeKeyValid()});
  }
  
  changePrefixPassword(e) {
    this.setState({prefixPassword: e.target.value});
  }
  
  changeConfirmPrefixPassword(e) {
    this.setState({confirmPrefixPassword: e.target.value}, () => {this.isSafeKeyValid()});
  }
  
  changePrfPrefixSalt(e) {
    this.setState({prfPrefixSalt: e.target.value});
  }
  
  changeConfirmPrfPrefixSaltConfirm(e) {
    this.setState({prfPrefixSaltConfirm: e.target.value}, () => {this.isSafeKeyValid()});
  }
  
  editSafeKeyJwk(safeKeyJwk) {
    this.setState({safeKeyJwk: safeKeyJwk}, () => {this.isSafeKeyValid()});
  }
  
  isSafeKeyValid() {
    var isValid = true;
    if (!this.state.safeKey.display_name) {
      isValid = false;
    }
    if (this.state.safeKey.type === "password") {
      if (!this.state.newPassword) {
        isValid = false;
      }
      if (this.state.newPassword !== this.state.confirmNewPassword) {
        isValid = false;
      }
    } else if (this.state.safeKey.type === "master-password") {
      if (!this.state.newPassword) {
        isValid = false;
      }
      if (this.state.prefixPassword && this.state.prefixPassword !== this.state.confirmPrefixPassword) {
        isValid = false;
      }
    } else if (this.state.safeKey.type === "jwk") {
      try {
        let jwk = JSON.parse(this.state.safeKeyJwk);
        if (jwk.keys) {
          jwk = jwk.keys[0];
        }
        if (!jwk || !jwk.alg) {
          isValid = false;
        }
      } catch (e) {
        isValid = false;
      }
    } else if (this.state.safeKey.type === "prf") {
      if (this.state.prfPrefixSalt && ((this.state.prfPrefixSalt !== this.state.prfPrefixSaltConfirm) || this.state.prfPrefixSalt.length > 256)) {
        isValid = false;
      }
      if (!this.state.prfResult?.byteLength) {
        isValid = false;
      }
    }
    this.setState({isValid: isValid});
  }
  
  saveSafe(e) {
    e.preventDefault();
    if (this.state.isValid) {
      this.closeModal(e, true);
    }
  }
  
  createPrfCredential(e) {
    prfCommon.createCredential(this.state.profile.sub, this.state.profile.name||"Dave Lopper")
    .then(result => {
      this.setState({prfError: false, prfStep: 1, prfCredential: result.credentialId, prfSalt: result.salt});
    })
    .catch(err => {
      this.setState({prfError: err, prfStep: 0});
    });
  }
  
  createPrfFromKey() {
    let salt;
    if (this.state.prfPrefixSalt) {
      var enc = new TextEncoder();
      let prfPrefixSaltEnc = enc.encode(this.state.prfPrefixSalt);
      salt = new Uint8Array(prfPrefixSaltEnc.length + this.state.prfSalt.byteLength);
      salt.set(prfPrefixSaltEnc, 0);
      salt.set(new Uint8Array(this.state.prfSalt), prfPrefixSaltEnc.length);
    } else {
      salt = this.state.prfSalt;
    }
    prfCommon.createPrfFromKey(this.state.prfCredential, salt)
    .then(result => {
      this.setState({prfError: false, prfStep: 2, prfResult: result.prfResult}, () => {this.isSafeKeyValid()});
    })
    .catch(err => {
      this.setState({prfError: err});
    });
  }

  closeModal(e, result) {
    var jwk;
    try {
      jwk = JSON.parse(this.state.safeKeyJwk);
    } catch (err) {
      jwk = false;
    }
    if (this.state.cb) {
      this.state.cb(result, {
        safeKey: this.state.safeKey,
        password: this.state.prefixPassword+this.state.newPassword,
        prefixPassword: !!this.state.prefixPassword,
        jwk: jwk,
        prfCredential: this.state.prfCredential,
        prfPrefixSalt: this.state.prfPrefixSalt,
        prfSalt: this.state.prfSalt,
        prfResult: this.state.prfResult
      });
      this.setState({newPassword: "",
                    confirmNewPassword: "",
                    pwdScore: -1,
                    isValid: false,
                    prfStep: 0,
                    prfError: false,
                    prfCredential: false,
                    prfPrefixSalt: "",
                    prfPrefixSaltConfirm: "",
                    prfSalt: false,
                    prfResult: false});
    }
  }

	render() {
    var pwdScoreJsx;
    var inputJsx;
    if (this.state.safeKey.type === "password") {
      if (this.state.pwdScore === 0) {
        pwdScoreJsx = <span className="badge bg-danger">{i18next.t("pwdScoreTooGuessable")}</span>
      } else if (this.state.pwdScore === 1) {
        pwdScoreJsx = <span className="badge bg-warning">{i18next.t("pwdScoreVeryGuessable")}</span>
      } else if (this.state.pwdScore === 2) {
        pwdScoreJsx = <span className="badge bg-secondary">{i18next.t("pwdScoreSomewhatGuessable")}</span>
      } else if (this.state.pwdScore === 3) {
        pwdScoreJsx = <span className="badge bg-primary">{i18next.t("pwdScoreSafelyUnguessable")}</span>
      } else if (this.state.pwdScore === 4) {
        pwdScoreJsx = <span className="badge bg-success">{i18next.t("pwdScoreVeryUnguessable")}</span>
      }
      inputJsx =
        <div>
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">{i18next.t("newPassword")}</label>
            <input type="password"
                   autoComplete="off"
                   className="form-control"
                   id="newPassword"
                   placeholder={i18next.t("newPasswordPh")}
                   value={this.state.newPassword}
                   onChange={(e) => this.changeNewPassword(e)}/>
            {pwdScoreJsx}
          </div>
          <div className="mb-3">
            <label htmlFor="confirmNewPassword" className="form-label">{i18next.t("confirmNewPassword")}</label>
            <input type="password"
                   autoComplete="off"
                   className="form-control"
                   id="confirmNewPassword"
                   placeholder={i18next.t("confirmNewPasswordPh")}
                   value={this.state.confirmNewPassword}
                   onChange={(e) => this.changeConfirmNewPassword(e)}/>
          </div>
        </div>
    } else if (this.state.safeKey.type === "master-password") {
      inputJsx =
        <div>
          <div className="mb-3">
            <label htmlFor="prefixPassword" className="form-label">{i18next.t("prefixPassword")}</label>
            <input type="password"
                   autoComplete="off"
                   className="form-control"
                   id="prefixPassword"
                   placeholder={i18next.t("prefixPasswordPh")}
                   value={this.state.prefixPassword}
                   onChange={(e) => this.changePrefixPassword(e)}/>
            {pwdScoreJsx}
          </div>
          <div className="mb-3">
            <label htmlFor="confirmPrefixPassword" className="form-label">{i18next.t("confirmPrefixPassword")}</label>
            <input type="password"
                   autoComplete="off"
                   className="form-control"
                   id="confirmPrefixPassword"
                   placeholder={i18next.t("confirmPrefixPasswordPh")}
                   value={this.state.confirmPrefixPassword}
                   onChange={(e) => this.changeConfirmPrefixPassword(e)}/>
          </div>
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">{i18next.t("masterPassword")}</label>
            <input type="password"
            autoComplete="off"
            className="form-control"
            id="newPassword"
            placeholder={i18next.t("masterPasswordPh")}
            value={this.state.newPassword}
            onChange={(e) => this.changeNewPassword(e)}/>
          </div>
        </div>
    } else if (this.state.safeKey.type === "jwk") {
      var messageClass = "form-control", messageErrorJsx;
      if (!this.state.isValid) {
        messageClass += " is-invalid";
        messageErrorJsx =
          <div className="invalid-feedback">
            {i18next.t("jwkError")}
          </div>
      }
      inputJsx =
        <div className="mb-3">
          <label htmlFor="safeKeyJwk" className="form-label">{i18next.t("safeKeyJwk")}</label>
          <JwkInput isError={!this.state.isValid} ph={i18next.t("safeKeyJwkPh")} cb={this.editSafeKeyJwk}/>
          {messageErrorJsx}
        </div>
    } else if (this.state.safeKey.type === "prf") {
      let prfMessageJsx;
      if (this.state.prfError === "prfDisabled") {
        prfMessageJsx =
          <div className="mb-3">
            <span className="badge bg-warning">{i18next.t("prfErrorPrfDisabled")}</span>
          </div>
      } else if (this.state.prfError === "creationError") {
        prfMessageJsx =
          <div className="mb-3">
            <span className="badge bg-danger">{i18next.t("prfErrorCreationError")}</span>
          </div>
      } else if (this.state.prfError === "assertionError") {
        prfMessageJsx =
          <div className="mb-3">
            <span className="badge bg-danger">{i18next.t("prfErrorAssertionError")}</span>
          </div>
      }
      if (this.state.prfStep === 0) {
        inputJsx =
          <div>
            <div className="mb-3">
              <button type="button" className="btn btn-secondary" onClick={this.createPrfCredential}>{i18next.t("prfCreateCredential")}</button>
            </div>
            {prfMessageJsx}
          </div>
      } else if (this.state.prfStep === 1) {
        inputJsx =
          <div>
            <div className="mb-3">
              <label htmlFor="prefixPassword" className="form-label">{i18next.t("prefixPassword")}</label>
              <input type="password"
                     autoComplete="off"
                     className="form-control"
                     id="prefixPassword"
                     placeholder={i18next.t("prefixPasswordPh")}
                     value={this.state.prfPrefixSalt}
                     onChange={this.changePrfPrefixSalt}/>
              {pwdScoreJsx}
            </div>
            <div className="mb-3">
              <label htmlFor="confirmPrefixPassword" className="form-label">{i18next.t("confirmPrefixPassword")}</label>
              <input type="password"
                     autoComplete="off"
                     className="form-control"
                     id="confirmPrefixPassword"
                     placeholder={i18next.t("confirmPrefixPasswordPh")}
                     value={this.state.prfPrefixSaltConfirm}
                     onChange={this.changeConfirmPrfPrefixSaltConfirm}/>
            </div>
            <div className="mb-3">
              <button type="button" className="btn btn-secondary" onClick={this.createPrfFromKey}>{i18next.t("prfCreateCredential")}</button>
            </div>
            {prfMessageJsx}
          </div>
      } else if (this.state.prfStep === 2) {
        inputJsx = 
          <div className="mb-3">
            <span className="badge bg-success">{i18next.t("prfCreationSuccess")}</span>
          </div>
      }
    }
		return (
      <div className="modal" tabIndex="-1" id="modalSafeKey">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {i18next.t("modalSafeKey-" + this.state.safeKey.type)}
              </h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={(e) => this.closeModal(e, false)}></button>
            </div>
            <form onSubmit={this.saveSafe}>
              <div className="modal-body">
                  <input type="hidden" maxLength="128" id="safeKeyName" value={this.state.safeKey.name}/>
                  <div className="mb-3">
                    <label htmlFor="safeKeyDisplayName" className="form-label">{i18next.t("safeKeyDisplayName")}</label>
                    <input type="text"
                           maxLength="512"
                           className="form-control"
                           id="safeKeyDisplayName"
                           placeholder={i18next.t("safeKeyDisplayNamePh")}
                           value={this.state.safeKey.display_name}
                           onChange={(e) => this.changeDisplayName(e)}/>
                  </div>
                  {inputJsx}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)}>{i18next.t("modalClose")}</button>
                <button type="submit" className="btn btn-primary" onClick={(e) => this.saveSafe(e)} disabled={!this.state.isValid}>{i18next.t("modalOk")}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
		);
	}
}

export default ModalSafeKey;
