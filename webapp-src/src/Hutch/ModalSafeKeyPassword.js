import React, { Component } from 'react';
import i18next from 'i18next';

class ModalSafeKeyPassword extends Component {
  constructor(props) {
    super(props);

    this.state = {
      safeKey: props.safeKey,
      cb: props.callback,
      newPassword: "",
      confirmNewPassword: "",
      pwdScore: -1,
      isValid: false
    }

    this.changeNewPassword = this.changeNewPassword.bind(this);
    this.changeConfirmNewPassword = this.changeConfirmNewPassword.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

  changeDisplayName(e) {
    var safeKey = this.state.safeKey;
    safeKey.display_name = e.target.value;
    this.setState({safeKey: safeKey});
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
  
  isSafeKeyValid() {
    var isValid = true;
    if (!this.state.newPassword) {
      isValid = false;
    }
    if (this.state.newPassword !== this.state.confirmNewPassword) {
      isValid = false;
    }
    if (!this.state.safeKey.name) {
      isValid = false;
    }
    this.setState({isValid: isValid});
  }

  closeModal(e, result) {
    if (this.state.cb) {
      this.state.cb(result, {
        safeKey: this.state.safeKey,
        password: this.state.newPassword,
        safeKey: this.state.safeKey
      });
      this.setState({newPassword: "",
                    confirmNewPassword: "",
                    pwdScore: -1,
                    isValid: false});
    }
  }

	render() {
    var pwdScoreJsx;
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
            <div className="modal-body">
              <form onSubmit={this.saveSafe}>
                <input type="hidden" maxLength="128" id="safeKeyName" value={this.state.safeKey.name}/>
                <div className="mb-3">
                  <label htmlFor="safeKeyDisplayName" className="form-label">{i18next.t("safeKeyDisplayName")}</label>
                  <input type="text" maxLength="512" className="form-control" id="safeKeyDisplayName" value={this.state.safeKey.display_name} onChange={(e) => this.changeDisplayName(e)}/>
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">{i18next.t("newPassword")}</label>
                  <input type="password" autoComplete="off" className="form-control" id="newPassword" value={this.state.newPassword} onChange={(e) => this.changeNewPassword(e)}/>
                  {pwdScoreJsx}
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmNewPassword" className="form-label">{i18next.t("confirmNewPassword")}</label>
                  <input type="password" autoComplete="off" className="form-control" id="confirmNewPassword" value={this.state.confirmNewPassword} onChange={(e) => this.changeConfirmNewPassword(e)}/>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)}>{i18next.t("modalClose")}</button>
              <button type="button" className="btn btn-primary" onClick={(e) => this.closeModal(e, true)} disabled={!this.state.isValid}>{i18next.t("modalOk")}</button>
            </div>
          </div>
        </div>
      </div>
		);
	}
}

export default ModalSafeKeyPassword;
