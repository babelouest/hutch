import React, { Component } from 'react';

import i18next from 'i18next';

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
      exportInvalid: false
    };
    
    this.toggleExportSafeWithSecurity = this.toggleExportSafeWithSecurity.bind(this);
    this.changeExportSecurityType = this.changeExportSecurityType.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.changeConfirmPassword = this.changeConfirmPassword.bind(this);
    this.exportSafe = this.exportSafe.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  toggleExportSafeWithSecurity() {
    this.setState({exportSafeWithSecurity: !this.state.exportSafeWithSecurity}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  changeExportSecurityType(e) {
    this.setState({exportSecurityType: e.target.value}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  changePassword(e) {
    this.setState({password: e.target.value}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  changeConfirmPassword(e) {
    this.setState({confirmPassword: e.target.value}, () => {
      this.setState({exportInvalid: this.isExportInvalid()});
    });
  }
  
  isExportInvalid() {
    if (this.state.exportSafeWithSecurity) {
      if (this.state.exportSecurityType === "password") {
        if (!this.state.password || this.state.password !== this.state.confirmPassword) {
          return true;
        }
      }
    }
    return false;
  }

  exportSafe() {
    if (this.state.exportSafeWithSecurity) {
      if (this.state.exportSecurityType === "password") {
      }
    } else {
      var exported = [];
      this.state.safeContent[this.state.safe.name].unlockedCoinList.forEach(coin => {
        exported.push(coin.data);
      });
      var $anchor = $("#"+this.state.safe.name+"-download");
      console.log($anchor);
      $anchor.attr("href", "data:application/octet-stream;base64,"+btoa(JSON.stringify(exported)));
      $anchor[0].click();
    }
  }

  closeModal(e, result) {
    if (this.state.cbClose) {
      this.state.cbClose();
    }
  }
  
	render() {
    var exportSecurityTypeJsx, exportSecurityJsx;
    if (this.state.exportSafeWithSecurity) {
      exportSecurityTypeJsx =
        <select className="form-select" value={this.state.exportSecurityType} onChange={this.changeExportSecurityType}>
          <option value="password">{i18next.t("exportSecurityTypePassword")}</option>
          <option value="jwk">{i18next.t("exportSecurityTypeJwk")}</option>
        </select>
      if (this.state.exportSecurityType === "password") {
        exportSecurityJsx =
        <div>
          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label">{i18next.t("newPassword")}</label>
            <input type="password" className="form-control" id="newPassword" value={this.state.password} onChange={this.changePassword}/>
          </div>
          <div className="mb-3">
            <label htmlFor="confirmNewPassword" className="form-label">{i18next.t("confirmNewPassword")}</label>
            <input type="password" className="form-control" id="confirmNewPassword" value={this.state.confirmPassword} onChange={this.changeConfirmPassword}/>
          </div>
        </div>
      } else if (this.state.exportSecurityType === "jwk") {
      }
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
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)}>{i18next.t("modalClose")}</button>
              </div>
            </div>
          </div>
        </div>
        <a className="upload" id={this.state.safe.name+"-download"} download={this.state.safe.display_name+".json"} />
      </div>
    );
	}
}

export default ModalManageSafe;
