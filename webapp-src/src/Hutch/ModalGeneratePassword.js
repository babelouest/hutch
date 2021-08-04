import React, { Component } from 'react';
import i18next from 'i18next';

class ModalGeneratePassword extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cb: props.callback,
      element: props.element,
      password: "",
      passwordCharLength: 32,
      showPassword: false,
      lowercase: true,
      upprcase: true,
      numbers: true,
      special: true,
      spaces: true,
      noSimilarFollowingChars: false
    }
    this.toggleShowPassword = this.toggleShowPassword.bind(this);
    this.toggleParam = this.toggleParam.bind(this);
    this.changePasswordLength = this.changePasswordLength.bind(this);
    this.generateRandomChars = this.generateRandomChars.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  toggleShowPassword() {
    this.setState({showPassword: !this.state.showPassword});
  }
  
  toggleParam(e, param) {
    var newParam = {};
    newParam[param] = !this.state[param];
    this.setState(newParam);
  }

  changePasswordLength(e) {
    this.setState({passwordCharLength: parseInt(e.target.value)});
  }
  
  closeModal(e, result) {
    if (this.state.cb) {
      this.state.cb(result, this.state.password);
    }
  }
  
  randomRangeList(length, max) {
    var values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    for (var i=0; i<length; i++) {
      while (values[i] >= max) {
        var newValue = new Uint8Array(1);
        window.crypto.getRandomValues(newValue);
        values[i] = newValue[0];
      }
    }
    return values;
  }
  
  generateRandomChars() {
    var charList = "";
    if (this.state.lowercase) {
      charList += "abcdefghijklmnopqrstuvwxyz";
    }
    if (this.state.upprcase) {
      charList += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }
    if (this.state.numbers) {
      charList += "0123456789";
    }
    if (this.state.special) {
      charList += "!\"#$%&\\'()*+,-./:;<=>?@[]^_`{|}~";
    }
    if (this.state.spaces) {
      charList += " ";
    }
    var valuesArray = this.randomRangeList(this.state.passwordCharLength, charList.length);
    var password = "";
    for (var i=0; i<this.state.passwordCharLength; i++) {
      password += charList[valuesArray[i]];
    }
    this.setState({password: password});
  }

	render() {
    var passwordOutput = i18next.t("newPassword");
    if (this.state.showPassword) {
      passwordOutput = this.state.password;
    }
		return (
      <div className="modal" tabIndex="-1" id="modalGeneratePassword">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {i18next.t("modalGeneratePassword")}
              </h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={(e) => this.closeModal(e, false)}></button>
            </div>
            <div className="modal-body">
              <div className="accordion" id="passwordRandom">
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingOne">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#passwordRandomCharacters" aria-expanded="true" aria-controls="passwordRandomCharacters">
                      {i18next.t("passwordRandomCharacters")}
                    </button>
                  </h2>
                  <div id="passwordRandomCharacters" className="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#passwordRandom">
                    <div className="accordion-body">
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="lowercase" onChange={(e) => this.toggleParam(e, "lowercase")} checked={this.state.lowercase} />
                        <label className="form-check-label" htmlFor="lowercase">{i18next.t("passwordRandomLowercase")}</label>
                      </div>
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="upprcase" onChange={(e) => this.toggleParam(e, "upprcase")} checked={this.state.upprcase} />
                        <label className="form-check-label" htmlFor="upprcase">{i18next.t("passwordRandomUppercase")}</label>
                      </div>
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="numbers" onChange={(e) => this.toggleParam(e, "numbers")} checked={this.state.numbers} />
                        <label className="form-check-label" htmlFor="numbers">{i18next.t("passwordRandomNumbers")}</label>
                      </div>
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="special" onChange={(e) => this.toggleParam(e, "special")} checked={this.state.special} />
                        <label className="form-check-label" htmlFor="special">{i18next.t("passwordRandomSpecial")}</label>
                      </div>
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="spaces" onChange={(e) => this.toggleParam(e, "spaces")} checked={this.state.spaces} />
                        <label className="form-check-label" htmlFor="spaces">{i18next.t("passwordRandomSpaces")}</label>
                      </div>
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="noSimilarFollowingChars" onChange={(e) => this.toggleParam(e, "noSimilarFollowingChars")} checked={this.state.noSimilarFollowingChars} />
                        <label className="form-check-label" htmlFor="noSimilarFollowingChars">{i18next.t("passwordNoSimilarFollowingChars")}</label>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="passwordCharLength" className="form-label">{i18next.t("passwordCharLength")}</label>
                        <input type="number" step="1" min="0" className="form-control" id="passwordCharLength" value={this.state.passwordCharLength} onChange={this.changePasswordLength}/>
                      </div>
                      <div className="mb-3">
                        <button type="button" className="btn btn-secondary" onClick={this.generateRandomChars} disabled={!this.state.lowercase && !this.state.upprcase && !this.state.numbers && !this.state.special}>{i18next.t("passwordGenerate")}</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingTwo">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#passwordRandomWords" aria-expanded="false" aria-controls="passwordRandomWords">
                      {i18next.t("passwordRandomWords")}
                    </button>
                  </h2>
                  <div id="passwordRandomWords" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#passwordRandom">
                    <div className="accordion-body">
                    </div>
                  </div>
                </div>
              </div>
              <div className="input-group mb-3">
                <span className="input-group-text">{passwordOutput}</span>
                <button className="btn btn-outline-secondary" type="button" onClick={this.toggleShowPassword}>
                  <i className="fa fa-eye" aria-hidden="true"></i>
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)}>{i18next.t("modalClose")}</button>
              <button type="button" className="btn btn-primary" onClick={(e) => this.closeModal(e, true)} disabled={!this.state.password}>{i18next.t("modalCloseAndSave")}</button>
            </div>
          </div>
        </div>
      </div>
		);
	}
}

export default ModalGeneratePassword;
