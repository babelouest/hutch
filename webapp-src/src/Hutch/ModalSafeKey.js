import React, { Component } from 'react';
import i18next from 'i18next';

import JwkInput from './JwkInput';

class ModalSafeKey extends Component {
  constructor(props) {
    super(props);

    this.state = {
      safeKey: props.safeKey,
      cb: props.callback,
      newPassword: "",
      confirmNewPassword: "",
      safeKeyJwk: "",
      keyName: "",
      pwdScore: -1,
      isValid: false
    }

    this.changeNewPassword = this.changeNewPassword.bind(this);
    this.changeConfirmNewPassword = this.changeConfirmNewPassword.bind(this);
    this.editSafeKeyJwk = this.editSafeKeyJwk.bind(this);
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
    } else if (this.state.safeKey.type === "jwk") {
      try {
        if (!this.state.safeKeyJwk || !(JSON.parse(this.state.safeKeyJwk).alg)) {
          isValid = false;
        }
      } catch (e) {
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
        password: this.state.newPassword,
        jwk: jwk
      });
      this.setState({newPassword: "",
                    confirmNewPassword: "",
                    pwdScore: -1,
                    isValid: false});
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
    }
		return (
      <div className="modal" tabIndex="-1" id="modalSafeKey">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {i18next.t("modalSafeKey")}
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
