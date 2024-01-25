import React, { Component } from 'react';

import i18next from 'i18next';
import { importJWK, EncryptJWT } from 'jose-browser-runtime';
import JwkInput from './JwkInput';
import qrcode from 'qrcode-generator';

import messageDispatcher from '../lib/MessageDispatcher';
import prfCommon from '../lib/PrfCommon';

class ManageExportData extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      profile: props.profile,
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
      exportJwk: "",
      qrCode: false,
      prfStep: 0,
      prfError: false,
      prfCredential: false,
      prfPrefixSalt: "",
      prfPrefixSaltConfirm: "",
      prfSalt: false,
      prfResult: false
    };
    this.toggleExportSafeWithSecurity = this.toggleExportSafeWithSecurity.bind(this);
    this.changeExportSecurityType = this.changeExportSecurityType.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.changeConfirmPassword = this.changeConfirmPassword.bind(this);
    this.changePrefixPassword = this.changePrefixPassword.bind(this);
    this.changeConfirmPrefixPassword = this.changeConfirmPrefixPassword.bind(this);
    this.exportSafe = this.exportSafe.bind(this);
    this.editExportJwk = this.editExportJwk.bind(this);
    this.generateExport = this.generateExport.bind(this);
    this.exportToClipboard = this.exportToClipboard.bind(this);
    this.showQrCode = this.showQrCode.bind(this);
    this.createPrfCredential = this.createPrfCredential.bind(this);
    this.createPrfFromKey = this.createPrfFromKey.bind(this);
    this.changePrfPrefixSalt = this.changePrfPrefixSalt.bind(this);
    this.changeConfirmPrfPrefixSaltConfirm = this.changeConfirmPrfPrefixSaltConfirm.bind(this);
  }
  
  toggleExportSafeWithSecurity() {
    this.setState({exportSafeWithSecurity: !this.state.exportSafeWithSecurity, importData: false, importDataResult: false, importTotalCount: 0, importTotalSuccess: 0, importSecurityType: false, qrCode: false}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  changeExportSecurityType(e) {
    this.setState({exportSecurityType: e.target.value, qrCode: false}, () => {
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
    this.setState({prefixPassword: e.target.value}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  changeConfirmPrefixPassword(e) {
    this.setState({confirmPrefixPassword: e.target.value}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
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
        } else if (!!this.state.prefixPassword && (this.state.prefixPassword !== this.state.confirmPrefixPassword)) {
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
      } else if (this.state.exportSecurityType === "prf") {
        if (!this.state.prfResult) {
          return true;
        } else if (!!this.state.prfPrefixSalt && ((this.state.prfPrefixSalt !== this.state.prfPrefixSaltConfirm) || this.state.prfPrefixSalt.length > 256)) {
          return true;
        }
      }
    }
    return false;
  }

  generateExport() {
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
        return new EncryptJWT({data: exported})
        .setProtectedHeader({alg: lockAlg, enc: this.state.safe.enc_type||"A256GCM"})
        .encrypt(containerKey);
      } else if (this.state.exportSecurityType === "jwk") {
        var key = JSON.parse(this.state.exportJwk);
        key.use = "enc";
        return importJWK(key, key.alg)
        .then((exportKey) => {
          if (exportKey.type === "public" || exportKey.type === "secret") {
            return new EncryptJWT({data: exported})
            .setProtectedHeader({alg: key.alg, enc: this.state.safe.enc_type})
            .encrypt(exportKey);
          } else {
            this.setState({exportInvalid: 1});
          }
        });
      } else if (this.state.exportSecurityType === "prf") {
        var enc = new TextEncoder();
        var lockAlg = "PBES2-HS512+A256KW";
        if (this.state.safe.alg_type === "A192KW" || this.state.safe.alg_type === "A192GCMKW" || this.state.safe.alg_type === "PBES2-HS384+A192KW") {
          lockAlg = "PBES2-HS384+A192KW";
        } else if (this.state.safe.alg_type === "A128KW" || this.state.safe.alg_type === "A128GCMKW" || this.state.safe.alg_type === "PBES2-HS256+A128KW") {
          lockAlg = "PBES2-HS256+A128KW";
        }
        return new EncryptJWT({data: exported})
        .setProtectedHeader({
          alg: lockAlg,
          enc: this.state.safe.enc_type||"A256GCM",
          prfPrefixSalt: !!this.state.prfPrefixSalt,
          prf: {
            credential: btoa(String.fromCharCode.apply(null, new Uint8Array(this.state.prfCredential))),
            salt: btoa(String.fromCharCode.apply(null, new Uint8Array(this.state.prfSalt)))
          }
        })
        .encrypt(new Uint8Array(this.state.prfResult));
      }
    } else {
      return Promise.resolve(JSON.stringify(exported));
    }
  }

  exportToClipboard(e) {
    e.preventDefault();
    this.generateExport()
    .then((res) => {
      navigator.clipboard.writeText(res).then(() => {
        messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageCopyToClipboard")});
      });
      try {
        var manageSafeModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#manageSafe'));
        if (manageSafeModal) {
          manageSafeModal.hide();
        }
      } catch (e) {
      }
      try {
        var exportCoinModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#exportCoinModal'));
        if (exportCoinModal) {
          exportCoinModal.hide();
        }
      } catch (e) {
      }
      this.setState({
        exportSafeWithSecurity: false,
        exportSecurityType: "password",
        pwdScore: -1,
        password: "",
        prefixPassword: "",
        confirmPrefixPassword: "",
        exportInvalid: false,
        exportJwk: "",
        qrCode: false,
        prfStep: 0,
        prfError: false,
        prfCredential: false,
        prfPrefixSalt: "",
        prfPrefixSaltConfirm: "",
        prfSalt: false,
        prfResult: false
      });
    });
  }

  exportSafe(e) {
    e.preventDefault();
    this.generateExport()
    .then((res) => {
      var $anchor = $("#"+this.state.id+"-download");
      $anchor.attr("href", "data:application/octet-stream;base64,"+btoa(res));
      $anchor.attr("download", this.state.name+".jwt");
      $anchor[0].click();
      if (this.state.safe.offline) {
        messageDispatcher.sendMessage('App', {action: "offlineSafeExported", safeName: this.state.safe.name});
      } else {
        messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("exportSuccess")});
      }
      try {
        var manageSafeModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#manageSafe'));
        if (manageSafeModal) {
          manageSafeModal.hide();
        }
      } catch (e) {
      }
      try {
        var exportCoinModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#exportCoinModal'));
        if (exportCoinModal) {
          exportCoinModal.hide();
        }
      } catch (e) {
      }
      this.setState({
        exportSafeWithSecurity: false,
        exportSecurityType: "password",
        pwdScore: -1,
        password: "",
        prefixPassword: "",
        confirmPrefixPassword: "",
        exportInvalid: false,
        exportJwk: "",
        qrCode: false,
        prfStep: 0,
        prfError: false,
        prfCredential: false,
        prfPrefixSalt: "",
        prfPrefixSaltConfirm: "",
        prfSalt: false,
        prfResult: false
      });
    });
  }
  
  showQrCode(e) {
    e.preventDefault();
    this.generateExport()
    .then((res) => {
      this.setState({qrCode: res});
    });
  }

  createPrfCredential(e) {
    prfCommon.createCredential(this.state.profile.sub, this.state.profile.name||"Dave Lopper")
    .then(result => {
      this.setState({exportInvalid: true, prfError: false, prfStep: 1, prfCredential: result.credentialId, prfSalt: result.salt});
    })
    .catch(err => {
      this.setState({exportInvalid: true, prfError: err, prfStep: 0});
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
      this.setState({prfError: false, prfStep: 2, prfResult: result.prfResult}, () => {
        this.setState({exportInvalid: this.isExportInvalid()});
      });
    })
    .catch(err => {
      this.setState({exportInvalid: true, prfError: err});
    });
  }

  changePrfPrefixSalt(e) {
    this.setState({prfPrefixSalt: e.target.value});
  }
  
  changeConfirmPrfPrefixSaltConfirm(e) {
    this.setState({prfPrefixSaltConfirm: e.target.value, exportInvalid: this.isExportInvalid()});
  }
  
	render() {
    var exportSecurityTypeJsx, exportSecurityJsx, qrCodeJsx;
    if (this.state.exportSafeWithSecurity) {
      exportSecurityTypeJsx =
        <select className="form-select" value={this.state.exportSecurityType} onChange={this.changeExportSecurityType}>
          <option value="password">{i18next.t("securityTypePassword")}</option>
          <option value="master-password">{i18next.t("securityTypeMasterPassword")}</option>
          <option value="jwk">{i18next.t("securityTypeJwk")}</option>
          <option value="prf">{i18next.t("securityTypePrf")}</option>
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
      } else if (this.state.exportSecurityType === "prf") {
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
          exportSecurityJsx =
            <div>
              <div className="mb-3">
                <button type="button" className="btn btn-secondary" onClick={this.createPrfCredential}>{i18next.t("prfCreateCredential")}</button>
              </div>
              {prfMessageJsx}
            </div>
        } else if (this.state.prfStep === 1) {
          exportSecurityJsx =
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
          exportSecurityJsx = 
            <div className="mb-3">
              <span className="badge bg-success">{i18next.t("prfCreationSuccess")}</span>
            </div>
        }
      }
    }
    if (this.state.qrCode) {
      let qr = qrcode(0, 'L');
      if (this.state.qrCode.length < 23648) {
        qr.addData(this.state.qrCode);
        qr.make();
        qrCodeJsx = 
          <div className="text-center">
            <img className="img-fluid" src={qr.createDataURL(4)} alt="qrcode" />
          </div>
      } else {
        qrCodeJsx = 
          <div className="alert alert-warning" role="alert">
            {i18next.t("exportShowQrCodeTooLarge")}
          </div>
      }
    }
    return (
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
        {exportSecurityTypeJsx}
        <form onSubmit={(e) => this.exportSafe(e)}>
          {exportSecurityJsx}
          <div className="btn-group">
            <button type="submit" className="btn btn-secondary" onClick={this.exportSafe} title={i18next.t("downloadExport")} disabled={this.state.exportInvalid}>
              <i className="fa fa-cloud-download" aria-hidden="true"></i>
            </button>
            <button type="button" className="btn btn-secondary" onClick={this.exportToClipboard} title={i18next.t("exportSafeToClipboard")} disabled={this.state.exportInvalid}>
              <i className="fa fa-files-o" aria-hidden="true"></i>
            </button>
            <button type="button" className="btn btn-secondary" onClick={this.showQrCode} title={i18next.t("exportShowQrCode")} disabled={this.state.exportInvalid}>
              <i className="fa fa-qrcode" aria-hidden="true"></i>
            </button>
          </div>
          <a className="upload" id={this.state.id+"-download"} />
          {qrCodeJsx}
        </form>
      </div>
    );
	}
}

export default ManageExportData;
