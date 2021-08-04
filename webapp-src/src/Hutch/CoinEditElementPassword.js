import React, { Component } from 'react';

import i18next from 'i18next';

import ModalGeneratePassword from './ModalGeneratePassword';

class CoinEditElementPassword extends Component {
  constructor(props) {
    super(props);

    this.state = {
      coin: props.coin,
      element: props.element,
      index: props.index,
      cbSave: props.cbSave,
      cbCancel: props.cbCancel,
      password: "",
      passwordConfirm: "",
      showModalGeneratePassword: false
    };
    
    this.changePassword = this.changePassword.bind(this);
    this.changePasswordConfirm = this.changePasswordConfirm.bind(this);
    this.closeAndSave = this.closeAndSave.bind(this);
    this.openGenerateModal = this.openGenerateModal.bind(this);
    this.getGeneratedPassword = this.getGeneratedPassword.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  changePassword(e) {
    this.setState({password: e.target.value});
  }

  changePasswordConfirm(e) {
    this.setState({passwordConfirm: e.target.value});
  }
  
  closeAndSave(e) {
    if (this.state.password && this.state.password === this.state.passwordConfirm) {
      var element = this.state.element;
      element.value = this.state.password;
      this.state.cbSave(e, element, this.state.index);
    }
  }
  
  openGenerateModal() {
    this.setState({showModalGeneratePassword: true}, () => {
      var modalGeneratePassword = new bootstrap.Modal(document.getElementById('modalGeneratePassword'), {
        keyboard: false
      });
      modalGeneratePassword.show();
    });
  }
  
  getGeneratedPassword(result, newPassword) {
    if (result) {
      navigator.clipboard.writeText(newPassword).then(() => {
        $.snack("info", i18next.t("messageCopyToClipboard"));
        var element = this.state.element;
        element.value = this.state.newPassword;
        this.setState({element: element, password: newPassword, passwordConfirm: newPassword});
      });
    }
    var modalGeneratePassword = bootstrap.Modal.getOrCreateInstance(document.querySelector('#modalGeneratePassword'));
    modalGeneratePassword.hide();
    this.setState({showModalGeneratePassword: false});
  }

	render() {
    var modalGenerate;
    if (this.state.showModalGeneratePassword) {
      modalGenerate = <ModalGeneratePassword element={this.state.element} callback={this.getGeneratedPassword} />
    }
    return (
      <form onSubmit={(e) => this.state.cbSave(e, this.state.element, this.state.index)}>
        <div className="mb-3">
          <label htmlFor={this.state.coin.name+"-"+this.state.index} className="form-label">{i18next.t("coinElementPassword")}</label>
          <input type="password"
                 className="form-control"
                 id={this.state.coin.name+"-"+this.state.index}
                 value={this.state.password}
                 onChange={this.changePassword} />
        </div>
        <div className="mb-3">
          <label htmlFor={this.state.coin.name+"-"+this.state.index} className="form-label">{i18next.t("coinElementPasswordConfirm")}</label>
          <input type="password"
                 className="form-control"
                 id={this.state.coin.name+"-"+this.state.index+"-confirm"}
                 value={this.state.passwordConfirm}
                 onChange={this.changePasswordConfirm} />
        </div>
        <div className="mb-3">
          <div className="btn-group">
            <button type="button" className="btn btn-secondary" onClick={(e) => this.state.cbCancel(e, this.state.index)}>{i18next.t("modalClose")}</button>
            <button type="submit" className="btn btn-primary" onClick={(e) => this.closeAndSave(e)} disabled={!this.state.password || this.state.password !== this.state.passwordConfirm}>{i18next.t("modalOk")}</button>
          </div>
          <div className="btn-group float-end">
            <button type="button" className="btn btn-secondary" onClick={this.openGenerateModal} title={i18next.t("coinPasswordGenerate")}>
              <i className="fa fa-magic" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        {modalGenerate}
      </form>
    );
	}
}

export default CoinEditElementPassword;
