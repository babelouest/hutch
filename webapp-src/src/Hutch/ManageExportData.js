import React, { Component } from 'react';

import i18next from 'i18next';
import { importJWK, EncryptJWT } from 'jose-browser-runtime';
import JwkInput from './JwkInput';

import messageDispatcher from '../lib/MessageDispatcher';

class ManageExportData extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      safe: props.safe,
      content: props.content,
      id: props.id,
      name: props.name,
      exportSafeWithSecurity: false,
      exportSecurityType: "password",
      pwdScore: -1,
      password: "",
      confirmPassword: "",
      prefixPassword: "",
      confirmPrefixPassword: "",
      exportInvalid: false,
      exportJwk: ""
    };
    this.toggleExportSafeWithSecurity = this.toggleExportSafeWithSecurity.bind(this);
    this.changeExportSecurityType = this.changeExportSecurityType.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.changeConfirmPassword = this.changeConfirmPassword.bind(this);
    this.changePrefixPassword = this.changePrefixPassword.bind(this);
    this.changeConfirmPrefixPassword = this.changeConfirmPrefixPassword.bind(this);
    this.exportSafe = this.exportSafe.bind(this);
    this.editExportJwk = this.editExportJwk.bind(this);
  }
  
  toggleExportSafeWithSecurity() {
    this.setState({exportSafeWithSecurity: !this.state.exportSafeWithSecurity, importData: false, importDataResult: false, importTotalCount: 0, importTotalSuccess: 0, importSecurityType: false}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  changeExportSecurityType(e) {
    this.setState({exportSecurityType: e.target.value}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  changePassword(e) {
    var pwdScore = -1;
    if (e.target.value) {
      pwdScore = zxcvbn(e.target.value).score;
    }
    this.setState({password: e.target.value, pwdScore: pwdScore}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  changeConfirmPassword(e) {
    this.setState({confirmPassword: e.target.value}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  changePrefixPassword(e) {
    this.setState({prefixPassword: e.target.value});
  }
  
  changeConfirmPrefixPassword(e) {
    this.setState({confirmPrefixPassword: e.target.value}, () => {this.isExportInvalid()});
  }
  
  editExportJwk(exportJwk) {
    this.setState({exportJwk: exportJwk}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  isExportInvalid() {
    if (this.state.exportSafeWithSecurity) {
      if (this.state.exportSecurityType === "password") {
        if (!this.state.password || this.state.password !== this.state.confirmPassword) {
          return true;
        }
      } else if (this.state.exportSecurityType === "master-password") {
        if (!this.state.password) {
          return true;
        }
      } else if (this.state.exportSecurityType === "jwk") {
        try {
          if (!this.state.exportJwk || !(JSON.parse(this.state.exportJwk).alg)) {
            return true;
          }
        } catch (e) {
          return true;
        }
      }
    }
    return false;
  }

  exportSafe(e) {
    e.preventDefault();
    var exported = [];
    this.state.content.forEach(coin => {
      let data = Object.assign({}, coin.data);
      data.name = coin.name;
      exported.push(data);
    });
    if (this.state.exportSafeWithSecurity) {
      if (this.state.exportSecurityType === "password" || this.state.exportSecurityType === "master-password") {
        var enc = new TextEncoder();
        var containerKey = enc.encode(this.state.prefixPassword + this.state.password);
        var lockAlg = "PBES2-HS512+A256KW";
        if (this.state.safe.alg_type === "A192KW" || this.state.safe.alg_type === "A192GCMKW" || this.state.safe.alg_type === "PBES2-HS384+A192KW") {
          lockAlg = "PBES2-HS384+A192KW";
        } else if (this.state.safe.alg_type === "A128KW" || this.state.safe.alg_type === "A128GCMKW" || this.state.safe.alg_type === "PBES2-HS256+A128KW") {
          lockAlg = "PBES2-HS256+A128KW";
        }
        new EncryptJWT({data: exported})
        .setProtectedHeader({alg: lockAlg, enc: this.state.safe.enc_type||"A256GCM", sign_key: this.state.config.sign_thumb})
        .encrypt(containerKey)
        .then((jwt) => {
          var $anchor = $("#"+this.state.id+"-download");
          $anchor.attr("href", "data:application/octet-stream;base64,"+btoa(jwt));
          $anchor.attr("download", this.state.name+".jwt");
          $anchor[0].click();
          if (this.state.safe.offline) {
            messageDispatcher.sendMessage('App', {action: "offlineSafeExported", safeName: this.state.safe.name});
          }
        });
      } else if (this.state.exportSecurityType === "jwk") {
        var key = JSON.parse(this.state.exportJwk);
        key.use = "enc";
        importJWK(key, key.alg)
        .then((exportKey) => {
          if (exportKey.type === "public" || exportKey.type === "secret") {
            new EncryptJWT({data: exported})
            .setProtectedHeader({alg: key.alg, enc: this.state.safe.enc_type, sign_key: this.state.config.sign_thumb})
            .encrypt(exportKey)
            .then((jwt) => {
              var $anchor = $("#"+this.state.id+"-download");
              $anchor.attr("href", "data:application/octet-stream;base64,"+btoa(jwt));
              $anchor.attr("download", this.state.name+".jwt");
              $anchor[0].click();
              if (this.state.safe.offline) {
                messageDispatcher.sendMessage('App', {action: "offlineSafeExported", safeName: this.state.safe.name});
              }
            });
          } else {
            this.setState({exportInvalid: 1});
          }
        });
      }
    } else {
      var $anchor = $("#"+this.state.id+"-download");
      $anchor.attr("href", "data:application/octet-stream;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(exported)))));
      $anchor.attr("download", this.state.name+".json");
      $anchor[0].click();
      if (this.state.safe.offline) {
        messageDispatcher.sendMessage('App', {action: "offlineSafeExported", safeName: this.state.safe.name});
      }
    }
  }
  
	render() {
    var exportSecurityTypeJsx, exportSecurityJsx;
    if (this.state.exportSafeWithSecurity) {
      exportSecurityTypeJsx =
        <select className="form-select" value={this.state.exportSecurityType} onChange={this.changeExportSecurityType}>
          <option value="password">{i18next.t("securityTypePassword")}</option>
          <option value="master-password">{i18next.t("securityTypeMasterPassword")}</option>
          <option value="jwk">{i18next.t("securityTypeJwk")}</option>
        </select>
      if (this.state.exportSecurityType === "password") {
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
        exportSecurityJsx =
        <div>
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">{i18next.t("newPassword")}</label>
            <input type="password" autoComplete="new-password" className="form-control" id="newPassword" value={this.state.password} onChange={this.changePassword}/>
            {pwdScoreJsx}
          </div>
          <div className="mb-3">
            <label htmlFor="confirmNewPassword" className="form-label">{i18next.t("confirmNewPassword")}</label>
            <input type="password" autoComplete="new-password" className="form-control" id="confirmNewPassword" value={this.state.confirmPassword} onChange={this.changeConfirmPassword}/>
          </div>
        </div>
      } else if (this.state.exportSecurityType === "master-password") {
        exportSecurityJsx =
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
            value={this.state.password}
            onChange={(e) => this.changePassword(e)}/>
          </div>
        </div>
      } else if (this.state.exportSecurityType === "jwk") {
        var messageClass = "form-control", messageErrorJsx;
        if (this.state.exportInvalid) {
          messageClass += " is-invalid";
          messageErrorJsx =
            <div className="invalid-feedback">
              {i18next.t("jwkError")}
            </div>
        }
        exportSecurityJsx =
          <div className="mb-3">
            <label htmlFor="exportJwk" className="form-label">{i18next.t("exportJwk")}</label>
            <JwkInput isError={this.state.exportInvalid} errorMessage={i18next.t("safeSecretError")} ph={i18next.t("safeKeyJwkPh")} cb={this.editExportJwk}/>
            {messageErrorJsx}
          </div>
      }
    }
    return (
      <div>
        <div className="mb-3">
          <div className="form-check">
            <input className="form-check-input"
                   type="checkbox"
                   value=""
                   id={this.state.id+"-exportSafeWithSecurity"}
                   checked={this.state.exportSafeWithSecurity}
                   onChange={this.toggleExportSafeWithSecurity}/>
            <label className="form-check-label" htmlFor={this.state.id+"-exportSafeWithSecurity"}>
              {i18next.t("exportSafeWithSecurity")}
            </label>
          </div>
        </div>
        {exportSecurityTypeJsx}
        <form onSubmit={(e) => this.exportSafe(e)}>
          {exportSecurityJsx}
        </form>
        <div className="mb-3">
          <button type="button" className="btn btn-secondary" onClick={this.exportSafe} title={i18next.t("downloadExport")} disabled={this.state.exportInvalid}>
            <i className="fa fa-cloud-download" aria-hidden="true"></i>
          </button>
        </div>
        <a className="upload" id={this.state.id+"-download"} />
      </div>
    );
	}
}

export default ManageExportData;
