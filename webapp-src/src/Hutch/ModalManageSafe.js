import React, { Component } from 'react';

import i18next from 'i18next';

import { decodeProtectedHeader } from 'jose-browser-runtime/util/decode_protected_header';
import { jwtDecrypt } from 'jose-browser-runtime/jwt/decrypt';
import { parseJwk } from 'jose-browser-runtime/jwk/parse';

import ManageExportData from './ManageExportData';
import JwkInput from './JwkInput';

class ModalManageSafe extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      safe: props.safe,
      safeContent: props.safeContent,
      cbSaveCoin: props.cbSaveCoin,
      cbClose: props.cbClose,
      exportSafeWithSecurity: false,
      exportSecurityType: "password",
      password: "",
      confirmPassword: "",
      pwdScore: -1,
      importJwk: "",
      errorExportJwk: false,
      exportInvalid: false,
      importData: false,
      importDataResult: false,
      importTotalCount: 0,
      importTotalSuccess: 0,
      importSecurityType: false,
      importRunning: false
    };
    
    this.changePassword = this.changePassword.bind(this);
    this.getImportFile = this.getImportFile.bind(this);
    this.parseContent = this.parseContent.bind(this);
    this.importContent = this.importContent.bind(this);
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
    if (this.state.exportSafeWithSecurity) {
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
    return false;
  }

  editImportJwk(importJwk) {
    this.setState({importJwk: importJwk}, () => {
      this.setState({exportInvalid: this.isImportInvalid()});
    });
  }
  
  getImportFile(e) {
    this.setState({exportSafeWithSecurity: false, importData: false, importDataResult: false, importTotalCount: 0, importTotalSuccess: 0, importSecurityType: false}, () => {
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
        this.importContent(importDataJson);
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
  
  completeImportContent() {
    if (this.state.importSecurityType === "password") {
      var enc = new TextEncoder();
      jwtDecrypt(this.state.importData, enc.encode(this.state.password))
      .then((decImport) => {
        this.importContent(decImport.payload.data);
      })
      .catch(() => {
        this.setState({importDataResult: "invalidPassword"});
      });
    } else if (this.state.importSecurityType === "jwk") {
      try {
        var key = JSON.parse(this.state.importJwk);
        key.use = "enc";
        parseJwk(key, key.alg)
        .then((exportKey) => {
          jwtDecrypt(this.state.importData, exportKey)
          .then((decImport) => {
            this.importContent(decImport.payload.data);
          })
          .catch(() => {
            this.setState({importDataResult: "invalidJwk"});
          });
        });
      } catch (err) {
        this.setState({importDataResult: "invalidJwk"});
      }
    }
  }
  
  importContent(content) {
    var importedCoins = 0, nbElements = 0;
    this.setState({importRunning: true}, () => {
      content.forEach((coin) => {
        try {
          this.state.cbSaveCoin(true, false, coin)
          .then(() => {
            importedCoins++;
          })
          .catch(() => {
            $.snack("warning", i18next.t("messageErrorCoinSave"));
          })
          .finally(() => {
            nbElements++;
            if (nbElements === content.length) {
              if (nbElements === importedCoins) {
                this.setState({importDataResult: "importComplete", importTotalCount: importedCoins, importRunning: false})
              } else {
                this.setState({importDataResult: "importIncomplete", importTotalCount: importedCoins, importTotalSuccess: nbElements, importRunning: false})
              }
            }
          });
        } catch (e) {
          nbElements++;
          if (nbElements === content.length) {
            if (nbElements === importedCoins) {
              this.setState({importDataResult: "importComplete", importTotalCount: importedCoins, importRunning: false})
            } else {
              this.setState({importDataResult: "importIncomplete", importTotalCount: importedCoins, importTotalSuccess: nbElements, importRunning: false})
            }
          }
        }
      });
    });
  }

  closeModal(e, result) {
    if (this.state.cbClose) {
      this.state.cbClose();
    }
  }
  
	render() {
    var importDataResultJsx, importSecurityJsx, completeButtonJsx;
    if (this.state.importDataResult === "invalidData") {
      importDataResultJsx = 
        <div className="alert alert-danger" role="alert">
          {i18next.t("importInvalidData")}
        </div>
    } else if (this.state.importDataResult === "importComplete") {
      importDataResultJsx = 
        <div className="alert alert-success" role="alert">
          {i18next.t("importComplete", {count: this.state.importTotalCount})}
        </div>
    } else if (this.state.importDataResult === "importIncomplete") {
      importDataResultJsx = 
        <div className="alert alert-warning" role="alert">
          {i18next.t("importIncomplete", {count: this.state.importTotalCount, total: this.state.importTotalSuccess})}
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
        <button type="button" className="btn btn-secondary" onClick={this.completeImportContent} title={i18next.t("modalOk")} disabled={isDisabled || this.state.importRunning}>
          {i18next.t("modalOk")}{spinnerJsx}
        </button>
    }
    if (this.state.importSecurityType === "password") {
      importSecurityJsx =
        <div className="mb-3">
          <label htmlFor="newPassword" className="form-label">{i18next.t("importPassword")}</label>
          <input type="password" className="form-control" id="password" value={this.state.password} onChange={this.changePassword}/>
        </div>
    } else if (this.state.importSecurityType === "jwk") {
      importSecurityJsx =
        <div className="mb-3">
          <label htmlFor="importJwk" className="form-label">{i18next.t("importJwk")}</label>
          <JwkInput isError={false} ph={i18next.t("safeKeyJwkPh")} cb={this.editImportJwk}/>
        </div>
    }
    return (
      <div className="modal" tabIndex="-1" id="manageSafe">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{i18next.t("manageSafe")}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={(e) => this.closeModal(e, false)}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <div className="alert alert-primary" role="alert">
                  {i18next.t("exportSafe")}
                </div>
              </div>
              <ManageExportData config={this.state.config}
                                safe={this.state.safe}
                                content={this.state.safeContent[this.state.safe.name].unlockedCoinList}
                                id={this.state.safe.name}
                                name={this.state.safe.display_name} />
              <hr/>
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
                <label htmlFor="importSafeFileInput" className="btn btn-secondary">
                  <i className="fa fa-cloud-upload" aria-hidden="true"></i>
                </label>
                {importSecurityJsx}
                {completeButtonJsx}
                {importDataResultJsx}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)}>{i18next.t("modalClose")}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
	}
}

export default ModalManageSafe;
