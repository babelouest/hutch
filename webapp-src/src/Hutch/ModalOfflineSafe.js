import React, { Component } from 'react';

import i18next from 'i18next';
import { decodeProtectedHeader, jwtDecrypt, importJWK } from 'jose-browser-runtime';
import JwkInput from './JwkInput';

import messageDispatcher from '../lib/MessageDispatcher';

class ModalOfflineSafe extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      cbClose: props.cbClose,
      safeName: false,
      coinList: [],
      importJwk: "",
      importData: false,
      importDataResult: false,
      importTotalCount: 0,
      importTotalSuccess: 0,
      importSecurityType: false,
      importRunning: false,
      importComplete: false,
      coinMax: 0,
      coinNow: 0
    };
    
    this.changePassword = this.changePassword.bind(this);
    this.getImportFile = this.getImportFile.bind(this);
    this.parseContent = this.parseContent.bind(this);
    this.completeImportContent = this.completeImportContent.bind(this);
    this.editImportJwk = this.editImportJwk.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  changePassword(e) {
    var pwdScore = -1;
    if (e.target.value) {
      pwdScore = zxcvbn(e.target.value).score;
    }
    this.setState({password: e.target.value, pwdScore: pwdScore}, () => {
      this.setState({exportInvalid: this.isImportInvalid()});
    });
  }
  
  isImportInvalid() {
    if (this.state.exportSecurityType === "password") {
      if (!this.state.password || this.state.password !== this.state.confirmPassword) {
        return true;
      }
    } else if (this.state.exportSecurityType === "jwk") {
      try {
        if (!this.state.importJwk || !(JSON.parse(this.state.importJwk).alg)) {
          return true;
        }
      } catch (e) {
        return true;
      }
    }
  }

  editImportJwk(importJwk) {
    this.setState({importJwk: importJwk}, () => {
      this.setState({exportInvalid: this.isImportInvalid()});
    });
  }
  
  getImportFile(e) {
    let safeName = e.target.files[0].name;
    if (safeName.lastIndexOf('.') > -1) {
      safeName = safeName.substring(0, safeName.lastIndexOf('.'));
    }
    this.setState({importData: false, importDataResult: false, importTotalCount: 0, importTotalSuccess: 0, importSecurityType: false, safeName: safeName}, () => {
      var file = e.target.files[0];
      var fr = new FileReader();
      fr.onload = (ev2) => {
        this.setState({importData: ev2.target.result}, () => {
          this.parseContent();
        });
      };
      fr.readAsText(file);
    });
  }
  
  parseContent() {
    if (this.state.importData) {
      var importDataJson = false;
      try {
        importDataJson = JSON.parse(this.state.importData);
      } catch (e) {
      }
      if (importDataJson && Array.isArray(importDataJson)) {
        this.setState({coinList: importDataJson, importDataResult: "importComplete", importTotalCount: importDataJson.length, importComplete: true}, () => {
          messageDispatcher.sendMessage('App', {action: "addOfflineSafe", safeName: this.state.safeName, coinList: this.state.coinList});
          if (this.state.cbClose) {
            this.state.cbClose();
          }
        });
      } else {
        var header = false;
        try {
          header = decodeProtectedHeader(this.state.importData);
        } catch (e) {
          this.setState({importDataResult: "invalidData"});
        }
        if (header) {
          if (header.alg === "PBES2-HS256+A128KW" || header.alg === "PBES2-HS384+A192KW" || header.alg === "PBES2-HS512+A256KW") {
            this.setState({importSecurityType: "password"});
          } else {
            this.setState({importSecurityType: "jwk"});
          }
        }
      }
    } else {
      this.setState({importDataResult: "invalidData"});
    }
  }
  
  completeImportContent(e) {
    if (e) {
      e.preventDefault();
    }
    if (this.state.importSecurityType === "password") {
      var enc = new TextEncoder();
      jwtDecrypt(this.state.importData, enc.encode(this.state.password))
      .then((decImport) => {
        this.setState({coinList: decImport.payload.data, importDataResult: "importComplete", importTotalCount: decImport.payload.data.length, importComplete: true}, () => {
          messageDispatcher.sendMessage('App', {action: "addOfflineSafe", safeName: this.state.safeName, coinList: this.state.coinList});
          if (this.state.cbClose) {
            this.state.cbClose();
          }
        });
      })
      .catch(() => {
        this.setState({importDataResult: "invalidPassword", coinList: []});
      });
    } else if (this.state.importSecurityType === "jwk") {
      try {
        var key = JSON.parse(this.state.importJwk);
        key.use = "enc";
        importJWK(key, key.alg)
        .then((exportKey) => {
          jwtDecrypt(this.state.importData, exportKey)
          .then((decImport) => {
            this.setState({coinList: decImport.payload.data, importDataResult: "importComplete", importTotalCount: decImport.payload.data.length, importComplete: true}, () => {
              messageDispatcher.sendMessage('App', {action: "addOfflineSafe", safeName: this.state.safeName, coinList: this.state.coinList});
              if (this.state.cbClose) {
                this.state.cbClose();
              }
            });
          })
          .catch(() => {
            this.setState({importDataResult: "invalidJwk", coinList: []});
          });
        });
      } catch (err) {
        this.setState({importDataResult: "invalidJwk", coinList: []});
      }
    }
  }
  
  closeModal(e, result) {
    if (this.state.cbClose) {
      this.state.cbClose();
    }
  }
  
	render() {
    var importDataResultJsx, importSecurityJsx, completeButtonJsx, showProgressJsx;
    if (this.state.importDataResult === "invalidData") {
      importDataResultJsx = 
        <div className="alert alert-danger" role="alert">
          {i18next.t("importInvalidData")}
        </div>
    } else if (this.state.importDataResult === "importComplete") {
      importDataResultJsx = 
        <div className="alert alert-success" role="alert">
          {i18next.t("importOfflineComplete", {count: this.state.importTotalCount, name: this.state.safeName})}
        </div>
    } else if (this.state.importDataResult === "importIncomplete") {
      importDataResultJsx = 
        <div className="alert alert-warning" role="alert">
          {i18next.t("importOfflineIncomplete", {count: this.state.importTotalCount, total: this.state.importTotalSuccess, name: this.state.safeName})}
        </div>
    } else if (this.state.importDataResult === "invalidPassword") {
      importDataResultJsx = 
        <div className="alert alert-danger" role="alert">
          {i18next.t("importInvalidPassword")}
        </div>
    } else if (this.state.importDataResult === "invalidJwk") {
      importDataResultJsx = 
        <div className="alert alert-danger" role="alert">
          {i18next.t("importInvalidKey")}
        </div>
    }
    if (this.state.importSecurityType) {
      var spinnerJsx;
      if (this.state.importRunning) {
        spinnerJsx = <i className="fa fa-spinner fa-spin fa-fw btn-icon-right"></i>;
      }
      var isDisabled = (this.state.importSecurityType === "password" && !this.state.password) || (this.state.importSecurityType === "jwk" && !this.state.importJwk);
      completeButtonJsx =
        <button type="submit"
                className="btn btn-secondary"
                onClick={this.completeImportContent}
                title={i18next.t("modalOk")}
                disabled={isDisabled || this.state.importRunning || this.state.importComplete}>
          {i18next.t("modalOk")}{spinnerJsx}
        </button>
    }
    if (this.state.importSecurityType === "password") {
      importSecurityJsx =
        <div className="mb-3">
          <label htmlFor="password" className="form-label">{i18next.t("importPassword")}</label>
          <input type="password" className="form-control" id="password" autoComplete="new-password" value={this.state.password||""} onChange={this.changePassword}/>
        </div>
    } else if (this.state.importSecurityType === "jwk") {
      importSecurityJsx =
        <div className="mb-3">
          <label htmlFor="importJwk" className="form-label">{i18next.t("importJwk")}</label>
          <JwkInput isError={false} ph={i18next.t("safeKeyJwkPh")} cb={this.editImportJwk}/>
        </div>
    }
    return (
      <div className="modal" tabIndex="-1" id="offlineSafe">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{i18next.t("offlineSafe")}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={(e) => this.closeModal(e, false)}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <div className="alert alert-primary" role="alert">
                  {i18next.t("importSafe")}
                </div>
              </div>
              <div className="mb-3">
                <input type="file"
                       className="upload"
                       id="importSafeFileInput"
                       onChange={this.getImportFile} />
                <label htmlFor="importSafeFileInput" className="btn btn-secondary" disabled={this.state.oidcStatus !== "connected"}>
                  <i className="fa fa-cloud-upload" aria-hidden="true"></i>
                </label>
                <form onSubmit={this.completeImportContent}>
                  {importSecurityJsx}
                  {completeButtonJsx}
                </form>
                {showProgressJsx}
                {importDataResultJsx}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)} disabled={this.state.importRunning}>{i18next.t("modalClose")}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
	}
}

export default ModalOfflineSafe;
