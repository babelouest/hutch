import React, { Component } from 'react';

import i18next from 'i18next';

import { parseJwk } from 'jose/jwk/parse';
import { EncryptJWT } from 'jose/jwt/encrypt';
import { decodeProtectedHeader } from 'jose/util/decode_protected_header';
import { jwtDecrypt } from 'jose/jwt/decrypt';

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
      exportJwk: "",
      errorExportJwk: false,
      exportInvalid: false,
      importData: false,
      importDataResult: false,
      importTotalCount: 0,
      importTotalSuccess: 0,
      importSecurityType: false
    };
    
    this.toggleExportSafeWithSecurity = this.toggleExportSafeWithSecurity.bind(this);
    this.changeExportSecurityType = this.changeExportSecurityType.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.changeConfirmPassword = this.changeConfirmPassword.bind(this);
    this.exportSafe = this.exportSafe.bind(this);
    this.getImportFile = this.getImportFile.bind(this);
    this.parseContent = this.parseContent.bind(this);
    this.importContent = this.importContent.bind(this);
    this.completeImportContent = this.completeImportContent.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
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
  
  editExportJwk(e) {
    this.setState({exportJwk: e.target.value}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  isExportInvalid() {
    if (this.state.exportSafeWithSecurity) {
      if (this.state.exportSecurityType === "password") {
        if (!this.state.password || this.state.password !== this.state.confirmPassword) {
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

  exportSafe() {
    var exported = [];
    this.state.safeContent[this.state.safe.name].unlockedCoinList.forEach(coin => {
      exported.push(coin.data);
    });
    if (this.state.exportSafeWithSecurity) {
      if (this.state.exportSecurityType === "password") {
        var enc = new TextEncoder();
        var containerKey = enc.encode(this.state.password);
        var lockAlg = "PBES2-HS256+A128KW";
        if (this.state.safe.alg_type === "A192KW" || this.state.safe.alg_type === "A192GCMKW" || this.state.safe.alg_type === "PBES2-HS384+A192KW") {
          lockAlg = "PBES2-HS384+A192KW";
        } else if (this.state.safe.alg_type === "A256KW" || this.state.safe.alg_type === "A256GCMKW" || this.state.safe.alg_type === "PBES2-HS512+A256KW") {
          lockAlg = "PBES2-HS512+A256KW";
        }
        new EncryptJWT({data: exported})
        .setProtectedHeader({alg: lockAlg, enc: this.state.safe.enc_type, sign_key: this.state.config.sign_thumb})
        .encrypt(containerKey)
        .then((jwt) => {
          var $anchor = $("#"+this.state.safe.name+"-download");
          $anchor.attr("href", "data:application/octet-stream;base64,"+btoa(jwt));
          $anchor.attr("download", this.state.safe.display_name+".jwt");
          $anchor[0].click();
        });
      } else if (this.state.exportSecurityType === "jwk") {
        var key = JSON.parse(this.state.exportJwk);
        key.use = "enc";
        parseJwk(key, key.alg)
        .then((exportKey) => {
          new EncryptJWT({data: exported})
          .setProtectedHeader({alg: key.alg, enc: this.state.safe.enc_type, sign_key: this.state.config.sign_thumb})
          .encrypt(exportKey)
          .then((jwt) => {
            var $anchor = $("#"+this.state.safe.name+"-download");
            $anchor.attr("href", "data:application/octet-stream;base64,"+btoa(jwt));
            $anchor.attr("download", this.state.safe.display_name+".jwt");
            $anchor[0].click();
          });
        });
      }
    } else {
      var $anchor = $("#"+this.state.safe.name+"-download");
      $anchor.attr("href", "data:application/octet-stream;base64,"+btoa(JSON.stringify(exported)));
      $anchor.attr("download", this.state.safe.display_name+".json");
      $anchor[0].click();
    }
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
      var key = JSON.parse(this.state.exportJwk);
      key.use = "enc";
      parseJwk(key, key.alg)
      .then((exportKey) => {
        jwtDecrypt(this.state.importData, exportKey)
        .then((decImport) => {
          this.importContent(decImport.payload.data);
        })
        .catch((err) => {
          console.log(err);
          this.setState({importDataResult: "invalidJwk"});
        });
      });
    }
  }
  
  importContent(content) {
    var importedCoins = 0, nbElements = 0;
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
              this.setState({importDataResult: "importComplete", importTotalCount: importedCoins})
            } else {
              this.setState({importDataResult: "importIncomplete", importTotalCount: importedCoins, importTotalSuccess: nbElements})
            }
          }
        });
      } catch (e) {
        nbElements++;
        if (nbElements === content.length) {
          if (nbElements === importedCoins) {
            this.setState({importDataResult: "importComplete", importTotalCount: importedCoins})
          } else {
            this.setState({importDataResult: "importIncomplete", importTotalCount: importedCoins, importTotalSuccess: nbElements})
          }
        }
      }
    });
  }

  closeModal(e, result) {
    if (this.state.cbClose) {
      this.state.cbClose();
    }
  }
  
	render() {
    var exportSecurityTypeJsx, exportSecurityJsx, importDataResultJsx, importSecurityJsx;
    if (this.state.exportSafeWithSecurity) {
      exportSecurityTypeJsx =
        <select className="form-select" value={this.state.exportSecurityType} onChange={this.changeExportSecurityType}>
          <option value="password">{i18next.t("exportSecurityTypePassword")}</option>
          <option value="jwk">{i18next.t("exportSecurityTypeJwk")}</option>
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
            <input type="password" className="form-control" id="newPassword" value={this.state.password} onChange={this.changePassword}/>
            {pwdScoreJsx}
          </div>
          <div className="mb-3">
            <label htmlFor="confirmNewPassword" className="form-label">{i18next.t("confirmNewPassword")}</label>
            <input type="password" className="form-control" id="confirmNewPassword" value={this.state.confirmPassword} onChange={this.changeConfirmPassword}/>
          </div>
        </div>
      } else if (this.state.exportSecurityType === "jwk") {
        var messageClass = "form-control", messageErrorJsx;
        if (this.state.exportInvalid) {
          messageClass += " is-invalid";
          messageErrorJsx =
            <div className="invalid-feedback">
              {i18next.t("exportJwkError")}
            </div>
        }
        exportSecurityJsx =
          <div className="mb-3">
            <label htmlFor="exportJwk" className="form-label">{i18next.t("exportJwk")}</label>
            <textarea className={messageClass} id="exportJwk" value={this.state.exportJwk} onChange={(e) => this.editExportJwk(e)}></textarea>
            {messageErrorJsx}
          </div>
      }
    }
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
    if (this.state.importSecurityType === "password") {
      importSecurityJsx =
        <div>
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">{i18next.t("importPassword")}</label>
            <input type="password" className="form-control" id="password" value={this.state.password} onChange={this.changePassword}/>
          </div>
          <button type="button" className="btn btn-secondary" onClick={this.completeImportContent} title={i18next.t("modalOk")} disabled={!this.state.password}>
            {i18next.t("modalOk")}
          </button>
        </div>
    } else if (this.state.importSecurityType === "jwk") {
      importSecurityJsx =
        <div>
          <div className="mb-3">
            <label htmlFor="importJwk" className="form-label">{i18next.t("importJwk")}</label>
            <textarea className="form-control" id="importJwk" value={this.state.exportJwk} onChange={(e) => this.editExportJwk(e)}></textarea>
          </div>
          <button type="button" className="btn btn-secondary" onClick={this.completeImportContent} title={i18next.t("modalOk")} disabled={!this.state.exportJwk}>
            {i18next.t("modalOk")}
          </button>
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
              <div className="mb-3">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" value="" id="exportSafeWithSecurity" checked={this.state.exportSafeWithSecurity} onChange={this.toggleExportSafeWithSecurity}/>
                  <label className="form-check-label" htmlFor="exportSafeWithSecurity">
                    {i18next.t("exportSafeWithSecurity")}
                  </label>
                </div>
              </div>
              {exportSecurityTypeJsx}
              {exportSecurityJsx}
              <div className="mb-3">
                <button type="button" className="btn btn-secondary" onClick={this.exportSafe} title={i18next.t("downloadExport")} disabled={this.state.exportInvalid}>
                  <i className="fa fa-cloud-download" aria-hidden="true"></i>
                </button>
              </div>
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
                {importDataResultJsx}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)}>{i18next.t("modalClose")}</button>
              </div>
            </div>
          </div>
        </div>
        <a className="upload" id={this.state.safe.name+"-download"} />
      </div>
    );
	}
}

export default ModalManageSafe;
