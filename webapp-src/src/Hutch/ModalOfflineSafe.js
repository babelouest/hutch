import React, { Component } from 'react';
import { QrReader } from 'react-qr-reader';
import i18next from 'i18next';
import { decodeProtectedHeader, jwtDecrypt, importJWK } from 'jose-browser-runtime';

import JwkInput from './JwkInput';
import messageDispatcher from '../lib/MessageDispatcher';
import prfCommon from '../lib/PrfCommon';

function base64ToArrayBuffer(base64) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

class ModalOfflineSafe extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      cbClose: props.cbClose,
      safeName: false,
      coinList: [],
      password: "",
      prefixPassword: "",
      importJwk: "",
      importText: "",
      importData: false,
      importDataResult: false,
      importTotalCount: 0,
      importTotalSuccess: 0,
      importSecurityType: false,
      importRunning: false,
      importComplete: false,
      coinMax: 0,
      coinNow: 0,
      showScanQr: false,
      importDataJson: false,
      prfPrefixSalt: false,
      prf: false,
      prfResult: false,
      prfError: false,
      lockAfterTime: 0
    };
    
    this.changePassword = this.changePassword.bind(this);
    this.changePrefixPassword = this.changePrefixPassword.bind(this);
    this.changeImportText = this.changeImportText.bind(this);
    this.getImportFile = this.getImportFile.bind(this);
    this.parseContent = this.parseContent.bind(this);
    this.completeImportContent = this.completeImportContent.bind(this);
    this.editImportJwk = this.editImportJwk.bind(this);
    this.toggleScanQr = this.toggleScanQr.bind(this);
    this.handleQrCodeScan = this.handleQrCodeScan.bind(this);
    this.createPrfFromKey = this.createPrfFromKey.bind(this);
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
  
  changePrefixPassword(e) {
    this.setState({prefixPassword: e.target.value});
  }
  
  changeImportText(e) {
    this.setState({importText: e.target.value,
                   importData: e.target.value,
                   importDataResult: false,
                   importTotalCount: 0,
                   importTotalSuccess: 0,
                   importSecurityType: false,
                   safeName: "import"}, () => {
      this.parseContent();
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
    } else if (this.state.exportSecurityType === "prf") {
      if (!this.state.prfResult) {
        return true;
      }
      if (this.state.prfPrefixSalt && !this.state.prefixPassword) {
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
    this.setState({importData: false, importText: "", importDataResult: false, importTotalCount: 0, importTotalSuccess: 0, importSecurityType: false, safeName: safeName}, () => {
      var file = e.target.files[0];
      var fr = new FileReader();
      fr.onload = (ev2) => {
        this.setState({importData: ev2.target.result, importText: ev2.target.result}, () => {
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
        this.setState({importSecurityType: "none", importDataJson: importDataJson});
      } else {
        var header = false;
        try {
          header = decodeProtectedHeader(this.state.importData);
        } catch (e) {
          this.setState({importDataResult: "invalidData"});
        }
        if (header) {
          if (header.alg === "PBES2-HS256+A128KW" || header.alg === "PBES2-HS384+A192KW" || header.alg === "PBES2-HS512+A256KW") {
            if (header.prf) {
              this.setState({importSecurityType: "prf", prfPrefixSalt: header.prfPrefixSalt, prf: header.prf});
            } else {
              this.setState({importSecurityType: "password"});
            }
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
      let protectedHeader = decodeProtectedHeader(this.state.importData);
      if (["PBES2-HS256+A128KW", "PBES2-HS384+A192KW", "PBES2-HS512+A256KW"].indexOf(protectedHeader.alg) > -1) {
        var enc = new TextEncoder();
        jwtDecrypt(this.state.importData, enc.encode((this.state.prefixPassword||"") + this.state.password), {keyManagementAlgorithms: [protectedHeader.alg]})
        .then((decImport) => {
          this.setState({coinList: decImport.payload.data, importDataResult: "importComplete", importTotalCount: decImport.payload.data.length, importComplete: true}, () => {
            messageDispatcher.sendMessage('App', {action: "addOfflineSafe", safeName: this.state.safeName, coinList: this.state.coinList, lockAfterTime: this.state.lockAfterTime});
            if (this.state.cbClose) {
              this.state.cbClose();
            }
          });
        })
        .catch(() => {
          this.setState({importDataResult: "invalidPassword", coinList: []});
        });
      } else {
        this.setState({importDataResult: "invalidPassword"});
      }
    } else if (this.state.importSecurityType === "jwk") {
      try {
        var key = JSON.parse(this.state.importJwk);
        key.use = "enc";
        importJWK(key, key.alg)
        .then((exportKey) => {
          jwtDecrypt(this.state.importData, exportKey)
          .then((decImport) => {
            this.setState({coinList: decImport.payload.data, importDataResult: "importComplete", importTotalCount: decImport.payload.data.length, importComplete: true}, () => {
              messageDispatcher.sendMessage('App', {action: "addOfflineSafe", safeName: this.state.safeName, coinList: this.state.coinList, lockAfterTime: this.state.lockAfterTime});
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
    } else if (this.state.importSecurityType === "prf") {
      let protectedHeader = decodeProtectedHeader(this.state.importData);
      if (["PBES2-HS256+A128KW", "PBES2-HS384+A192KW", "PBES2-HS512+A256KW"].indexOf(protectedHeader.alg) > -1) {
        jwtDecrypt(this.state.importData, new Uint8Array(this.state.prfResult), {keyManagementAlgorithms: [protectedHeader.alg]})
        .then((decImport) => {
          this.setState({coinList: decImport.payload.data, importDataResult: "importComplete", importTotalCount: decImport.payload.data.length, importComplete: true}, () => {
            messageDispatcher.sendMessage('App', {action: "addOfflineSafe", safeName: this.state.safeName, coinList: this.state.coinList, lockAfterTime: this.state.lockAfterTime});
            if (this.state.cbClose) {
              this.state.cbClose();
            }
          });
        })
        .catch((err) => {
          this.setState({importDataResult: "invalidPassword"});
        });
      } else {
        this.setState({importDataResult: "invalidPassword"});
      }
    } else if (this.state.importSecurityType === "none") {
      this.setState({coinList: this.state.importDataJson, importDataResult: "importComplete", importTotalCount: this.state.importDataJson.length, importComplete: true}, () => {
        messageDispatcher.sendMessage('App', {action: "addOfflineSafe", safeName: this.state.safeName, coinList: this.state.coinList, lockAfterTime: this.state.lockAfterTime});
        if (this.state.cbClose) {
          this.state.cbClose();
        }
      });
    }
  }
  
  closeModal(e, result) {
    if (this.state.cbClose) {
      this.state.cbClose();
    }
  }
  
  toggleScanQr() {
    this.setState({showScanQr: !this.state.showScanQr});
  }
  
  handleQrCodeScan(result, error) {
    if (result && result.text) {
      this.setState({importText: result.text,
                     importData: result.text,
                     importDataResult: false,
                     importTotalCount: 0,
                     importTotalSuccess: 0,
                     importSecurityType: false,
                     safeName: "import",
                     showScanQr: false}, () => {
        this.parseContent();
      });
    }
  }

  createPrfFromKey(e) {
    let credentialDec = false, saltDec = false, headerSaltDec;
    let salt;
    try {
      headerSaltDec = base64ToArrayBuffer(this.state.prf.salt);
      credentialDec = base64ToArrayBuffer(this.state.prf.credential);
    } catch (e) {
      this.setState({prfError: true});
    }
    if (this.state.prfPrefixSalt) {
      var enc = new TextEncoder();
      let prfPrefixSaltEnc = enc.encode(this.state.prefixPassword);
      saltDec = new Uint8Array(prfPrefixSaltEnc.length + headerSaltDec.byteLength);
      saltDec.set(prfPrefixSaltEnc, 0);
      saltDec.set(new Uint8Array(headerSaltDec), prfPrefixSaltEnc.length);
    } else {
      saltDec = new Uint8Array(headerSaltDec);
    }
    if (credentialDec && saltDec) {
      prfCommon.createPrfFromKey(credentialDec, saltDec)
      .then(result => {
        this.setState({prfResult: result.prfResult});
      })
      .catch(err => {
        this.setState({prfError: true});
      });
    } else {
      this.setState({prfError: true});
    }
  }
  
  setLockAfter(e, value) {
    e.preventDefault();
    this.setState({lockAfterTime: value});
  }

	render() {
    var importDataResultJsx, importSecurityJsx, completeButtonJsx, showProgressJsx, scanQrJsx;
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
        <div>
          <div className="mb-3">
            <label htmlFor="prefix-password" className="form-label">{i18next.t("importPrefixPassword")}</label>
            <input type="password" className="form-control" id="prefix-password" autoComplete="new-password" value={this.state.prefixPassword} onChange={this.changePrefixPassword}/>
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">{i18next.t("importPassword")}</label>
            <input type="password" className="form-control" id="password" autoComplete="new-password" value={this.state.password} onChange={this.changePassword}/>
          </div>
        </div>
    } else if (this.state.importSecurityType === "jwk") {
      importSecurityJsx =
        <div className="mb-3">
          <label htmlFor="importJwk" className="form-label">{i18next.t("importJwk")}</label>
          <JwkInput isError={false} ph={i18next.t("safeKeyJwkPh")} cb={this.editImportJwk}/>
        </div>
    } else if (this.state.importSecurityType === "prf") {
      let prefixSaltJsx, prfErrorJsx;
      if (this.state.prfPrefixSalt) {
        prefixSaltJsx =
          <div className="mb-3">
            <label htmlFor="prefix-password" className="form-label">{i18next.t("importPrefixPassword")}</label>
            <input type="password" className="form-control" id="prefix-password" autoComplete="new-password" value={this.state.prefixPassword} onChange={this.changePrefixPassword}/>
          </div>
      }
      if (this.state.prfError) {
        prfErrorJsx =
          <div className="mb-3">
            <span className="badge bg-danger">{i18next.t("safeKeyError")}</span>
          </div>
      } else if (this.state.prfResult) {
        prfErrorJsx =
          <div className="mb-3">
            <span className="badge bg-success">{i18next.t("prfAssertionSuccess")}</span>
          </div>
      }
      importSecurityJsx =
        <div>
          {prefixSaltJsx}
          {prfErrorJsx}
          <div className="mb-3">
            <button type="button" className="btn btn-secondary" onClick={(e) => this.createPrfFromKey(e)}>{i18next.t("prfCreateCredential")}</button>
          </div>
        </div>
    }
    if (this.state.showScanQr) {
      scanQrJsx =
        <QrReader
          onResult={this.handleQrCodeScan}
          style={{ width: '100%' }}
          constraints={{ facingMode: 'environment' }}
        />
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
              </div>
              {i18next.t("or")}<hr/>
              <div className="mb-3">
                <label htmlFor="importText" className="form-label">{i18next.t("importText")}</label>
                <textarea className="form-control"
                          id="importText"
                          value={this.state.importText}
                          placeholder={i18next.t("importTextPh")}
                          onChange={this.changeImportText}>
                </textarea>
                <div className="btn-group">
                  <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)} disabled={!this.state.importText}>
                    <i className="fa fa-cloud-upload" aria-hidden="true"></i>
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={this.toggleScanQr} title={i18next.t("importQrCode")}>
                    <i className="fa fa-qrcode" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
              <div className="mb-3">
                {scanQrJsx}
              </div>
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <label className="input-group-text" htmlFor="lockAfterTime">
                    {i18next.t("removeAfter")}
                  </label>
                </div>
                <button className="btn btn-outline-secondary dropdown-toggle"
                        type="button"
                        id="lockAfterTime"
                        data-bs-toggle="dropdown"
                        aria-expanded="false">
                  {i18next.t("lockAfterTime"+this.state.lockAfterTime)}
                </button>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="#" onClick={(e) => this.setLockAfter(e, 0)}>{i18next.t("lockAfterTime0")}</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => this.setLockAfter(e, 60)}>{i18next.t("lockAfterTime60")}</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => this.setLockAfter(e, 300)}>{i18next.t("lockAfterTime300")}</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => this.setLockAfter(e, 900)}>{i18next.t("lockAfterTime900")}</a></li>
                  <li><a className="dropdown-item" href="#" onClick={(e) => this.setLockAfter(e, 3600)}>{i18next.t("lockAfterTime3600")}</a></li>
                </ul>
              </div>
              <div className="mb-3">
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
