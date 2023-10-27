import React, { Component } from 'react';
import i18next from 'i18next';
import qrcode from 'qrcode-generator';
import { QrReader } from 'react-qr-reader';

import { generateKeyPair, exportJWK } from 'jose-browser-runtime';

import apiManager from '../lib/APIManager';
import messageDispatcher from '../lib/MessageDispatcher';

import JwkOutput from './JwkOutput';

class ModalGeneratePassword extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      cb: props.callback,
      element: props.element,
      originalPassword: props.originalPassword,
      hideSaveAndClose: props.hideSaveAndClose,
      wordsLists: {},
      showPassword: false,
      passwordGenerated: false,
      keyType: "AS-ES256",
      keyAlg: "ECDH-ES+A128KW",
      keyPair: {private: false, public: false},
      qrcode: false,
      qrCodeError: false,
      showImportQrCode: false,
      qrcodeImported: false
    }
    
    this.toggleShowPassword = this.toggleShowPassword.bind(this);
    this.toggleParam = this.toggleParam.bind(this);
    this.changePasswordLength = this.changePasswordLength.bind(this);
    this.generateRandomChars = this.generateRandomChars.bind(this);
    this.changePasswordWordsNumber = this.changePasswordWordsNumber.bind(this);
    this.changePasswordWordsSeparator = this.changePasswordWordsSeparator.bind(this);
    this.generateRandomWords = this.generateRandomWords.bind(this);
    this.generateKey = this.generateKey.bind(this);
    this.copyOriginalPassword = this.copyOriginalPassword.bind(this);
    this.copyNewPassword = this.copyNewPassword.bind(this);
    this.changeKeyType = this.changeKeyType.bind(this);
    this.changeKeyAlg = this.changeKeyAlg.bind(this);
    this.showQrCode = this.showQrCode.bind(this);
    this.handleQrCodeScan = this.handleQrCodeScan.bind(this);
    this.toggleQrReader = this.toggleQrReader.bind(this);
    
    this.state.config.frontend.lang.forEach(lang => {
      apiManager.request("words-" + lang + ".json")
      .then(words => {
        var wordsLists = this.state.wordsLists;
        wordsLists[lang] = words;
        this.setState({wordsLists: wordsLists});
      });
    });
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  toggleShowPassword() {
    this.setState({showPassword: !this.state.showPassword});
  }
  
  showQrCode() {
    if (this.state.qrcode) {
      this.setState({qrcode: false, qrCodeError: false});
    } else {
      let qr = qrcode(0, 'L');
      if (this.state.element.value.length < 23648) {
        qr.addData(this.state.element.value);
        qr.make();
        this.setState({qrcode: qr.createDataURL(4), qrCodeError: false});
      } else {
        this.setState({qrcode: false, qrCodeError: true});
      }
    }
  }

  toggleParam(e, param) {
    var element = this.state.element;
    element.params[param] = !element.params[param];
    this.setState({element: element});
  }

  changePasswordLength(e) {
    var element = this.state.element;
    if (e.target.value) {
      element.params.passwordCharLength = parseInt(e.target.value);
    } else {
      element.params.passwordCharLength = 0;
    }
    this.setState({element: element});
  }
  
  closeModal(e, result) {
    if (this.state.cb) {
      this.state.cb(result, this.state.element);
    }
  }
  
  randomCharsRangeList(length, max) {
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
  
  randomWordsRangeList(length, max) {
    var values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    for (var i=0; i<length; i++) {
      while (values[i] >= max) {
        var newValue = new Uint32Array(1);
        window.crypto.getRandomValues(newValue);
        values[i] = newValue[0];
      }
    }
    return values;
  }
  
  generateRandomChars() {
    var charList = "";
    if (this.state.element.params.lowercase) {
      charList += "abcdefghijklmnopqrstuvwxyz";
    }
    if (this.state.element.params.upprcase) {
      charList += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }
    if (this.state.element.params.numbers) {
      charList += "0123456789";
    }
    if (this.state.element.params.special) {
      charList += "!\"#$%&\\'()*+,-./:;<=>?@[]^_`{|}~";
    }
    if (this.state.element.params.spaces) {
      charList += " ";
    }
    var valuesArray = this.randomCharsRangeList(this.state.element.params.passwordCharLength, charList.length);
    if (this.state.element.params.noSimilarFollowingChars) {
      for (var i=1; i<this.state.element.params.passwordCharLength; i++) {
        while (valuesArray[i] === valuesArray[i-1]) {
          var newValue = this.randomCharsRangeList(1, charList.length);
          valuesArray[i] = newValue[0];
        }
      }
    }
    var password = "";
    for (var i=0; i<this.state.element.params.passwordCharLength; i++) {
      password += charList[valuesArray[i]];
    }
    var element = this.state.element;
    element.params.type = "chars";
    element.value = password;
    this.setState({element: element, passwordGenerated: true, qrcodeImported: false, qrcode: false, qrCodeError: false});
  }
  
  changePasswordWordsNumber(e) {
    var element = this.state.element;
    if (e.target.value) {
      element.params.wordsNumber = parseInt(e.target.value);
    } else {
      element.params.wordsNumber = 0;
    }
    this.setState({element: element});
  }
  
  toggleWordsLang(e, lang) {
    var element = this.state.element;
    if (element.params.wordsLangsList.indexOf(lang) !== -1) {
      element.params.wordsLangsList.splice(element.params.wordsLangsList.indexOf(lang), 1);
    } else {
      element.params.wordsLangsList.push(lang);
    }
    this.setState({element: element});
  }
  
  changePasswordWordsSeparator(e) {
    var element = this.state.element;
    element.params.wordSeparator = e.target.value;
    this.setState({element: element});
  }
  
  generateRandomWords() {
    var wordsList = [];
    this.state.element.params.wordsLangsList.forEach(lang => {
      wordsList = wordsList.concat(this.state.wordsLists[lang]);
    });
    var valuesArray = this.randomWordsRangeList(this.state.element.params.wordsNumber, wordsList.length);
    var passwords = [];
    for (var i=0; i<this.state.element.params.wordsNumber; i++) {
      passwords.push(wordsList[valuesArray[i]]);
    }
    var element = this.state.element;
    element.params.type = "words";
    element.value = passwords.join(this.state.element.params.wordSeparator);
    this.setState({element: element, passwordGenerated: true, qrcodeImported: false, qrcode: false, qrCodeError: false});
  }
  
  generateKey() {
    let generateOption = {extractable: true};
    if (this.state.keyType === 'AS-RSA2048') {
      generateOption.modulusLength = 2048;
    } else if (this.state.keyType === 'AS-RSA4096') {
      generateOption.modulusLength = 4096;
    } else if (this.state.keyType === 'AS-ES256') {
      generateOption.crv = "P-256";
    } else if (this.state.keyType === 'AS-ES384') {
      generateOption.crv = "P-384";
    } else if (this.state.keyType === 'AS-ES512') {
      generateOption.crv = "P-512";
    }
    generateKeyPair(this.state.keyAlg, generateOption)
    .then((key) => {
      exportJWK(key.publicKey)
      .then(out => {
        out.alg = this.state.keyAlg;
        let keyPair = this.state.keyPair;
        keyPair.public = out;
        this.setState({keyPair: keyPair, qrcode: false, qrCodeError: false});
      });
      exportJWK(key.privateKey)
      .then(out => {
        out.alg = this.state.keyAlg;
        let keyPair = this.state.keyPair;
        keyPair.private = out;
        this.setState({keyPair: keyPair});
      });
    })
    .catch((err) => {
      console.error("generateKeyPair", err);
    });
  }

  copyOriginalPassword() {
    navigator.clipboard.writeText(this.state.originalPassword).then(() => {
      messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageCopyOriginalPasswordToClipboard")});
    });
  }
  
  copyNewPassword() {
    navigator.clipboard.writeText(this.state.element.value).then(() => {
      messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageCopyNewPasswordToClipboard")});
    });
  }
  
  changeKeyType(e) {
    let keyAlg = this.state.keyAlg;
    if (e.target.value.startsWith("AS-RSA") && !keyAlg.startsWith("RSA")) {
      keyAlg = "RSA-OAEP-256";
    } else if (e.target.value.startsWith("AS-ES") && !keyAlg.startsWith("ECDH")) {
      keyAlg = "ECDH-ES+A128KW";
    }
    this.setState({keyType: e.target.value, keyAlg: keyAlg});
  }
  
  changeKeyAlg(e) {
    this.setState({keyAlg: e.target.value});
  }

  handleQrCodeScan(result, error) {
    if (result && result.text) {
      let element = this.state.element;
      element.value = result.text;
      this.setState({showImportQrCode: false, passwordGenerated: false, qrcodeImported: true, element: element});
    }
  }
  
  toggleQrReader() {
    this.setState({showImportQrCode: !this.state.showImportQrCode});
  }

	render() {
    var passwordOutput = <div className="alert alert-primary" role="alert">{i18next.t("newPassword")}</div>
    if (this.state.showPassword && (this.state.passwordGenerated || this.state.qrcodeImported)) {
      passwordOutput = <div className="alert alert-secondary" role="alert"><code>{this.state.element.value}</code></div>
    } else if (this.state.passwordGenerated) {
      passwordOutput = <div className="alert alert-success" role="alert">{i18next.t("messagePasswordGenerated")}</div>
    } else if (this.state.qrcodeImported) {
      passwordOutput = <div className="alert alert-success" role="alert">{i18next.t("messageQrCodeImported")}</div>
    }
    var langListJsx = [];
    this.state.config.frontend.lang.forEach(lang => {
      langListJsx.push(
        <div className="form-group form-check" key={lang}>
          <input type="checkbox" className="form-check-input" id={"passwordWordsLangs-"+lang} onChange={(e) => this.toggleWordsLang(e, lang)} checked={this.state.element.params.wordsLangsList.indexOf(lang) !== -1} />
          <label className="form-check-label" htmlFor={"passwordWordsLangs-"+lang}>{i18next.t("passwordWordsLangs-"+lang)}</label>
        </div>
      );
    });
    var hideSaveAndCloseJsx, keyGeneratorJsx;
    if (this.state.hideSaveAndClose) {
      let keyAlgListJsx = [];
      if (this.state.keyType.startsWith('AS-RSA')) {
        keyAlgListJsx.push(<option key={0} value="RSA1_5">RSA1_5</option>);
        keyAlgListJsx.push(<option key={1} value="RSA-OAEP">RSA-OAEP</option>);
        keyAlgListJsx.push(<option key={2} value="RSA-OAEP-256">RSA-OAEP-256</option>);
      } else if (this.state.keyType.startsWith('AS-ES')) {
        keyAlgListJsx.push(<option key={0} value="ECDH-ES">ECDH-ES</option>);
        keyAlgListJsx.push(<option key={1} value="ECDH-ES+A128KW">ECDH-ES+A128KW</option>);
        keyAlgListJsx.push(<option key={2} value="ECDH-ES+A192KW">ECDH-ES+A192KW</option>);
        keyAlgListJsx.push(<option key={3} value="ECDH-ES+A256KW">ECDH-ES+A256KW</option>);
      }
      let privateJsx, publicJsx;
      if (this.state.keyPair.private) {
        privateJsx = <JwkOutput jwk={this.state.keyPair.private} private={true}/>
      }
      if (this.state.keyPair.public) {
        publicJsx = <JwkOutput jwk={this.state.keyPair.public} private={false}/>
      }
      keyGeneratorJsx =
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingThree">
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#keyGenerator" aria-expanded="true" aria-controls="keyGenerator">
              {i18next.t("keyGenerator")}
            </button>
          </h2>
          <div id="keyGenerator" className="accordion-collapse collapse" data-bs-parent="#secretGeneratorAccordion">
            <div className="accordion-body">
              <div className="input-group mb-3">
                <label className="input-group-text" htmlFor="keyType">{i18next.t("keyType")}</label>
                <select className="form-select" id="keyType" value={this.state.keyType} onChange={this.changeKeyType}>
                  <option value="AS-RSA2048">{i18next.t("keyTypeAsymmetricRSA2048")}</option>
                  <option value="AS-RSA4096">{i18next.t("keyTypeAsymmetricRSA4096")}</option>
                  <option value="AS-ES256">{i18next.t("keyTypeAsymmetricES256")}</option>
                  <option value="AS-ES384">{i18next.t("keyTypeAsymmetricES384")}</option>
                </select>
              </div>
              <div className="input-group mb-3">
                <label className="input-group-text" htmlFor="keyAlg">{i18next.t("keyAlg")}</label>
                <select className="form-select" id="keyAlg" value={this.state.keyAlg} onChange={this.changeKeyAlg}>
                  {keyAlgListJsx}
                </select>
              </div>
              <div className="mb-3">
                <button type="button" className="btn btn-secondary" onClick={this.generateKey}>{i18next.t("keyGenerate")}</button>
              </div>
              <div className="mb-3">
                {privateJsx}
              </div>
              <div className="mb-3">
                {publicJsx}
              </div>
            </div>
          </div>
        </div>
    } else {
      hideSaveAndCloseJsx = <button type="button" className="btn btn-primary" onClick={(e) => this.closeModal(e, true)} disabled={!this.state.passwordGenerated && !this.state.qrcodeImported}>{i18next.t("modalCloseAndSave")}</button>;
    }
    let qrReaderBodyJsx;
    if (this.state.showImportQrCode) {
      qrReaderBodyJsx =
        <div>
          <div className="mb-3">
            <button type="button" className="btn btn-secondary" onClick={this.toggleQrReader}>{i18next.t("hideQrCode")}</button>
          </div>
          <div className="mb-3">
            <QrReader
              onResult={this.handleQrCodeScan}
              style={{ width: '100%' }}
              constraints={{ facingMode: 'environment' }}
            />
          </div>
        </div>
    } else {
      qrReaderBodyJsx =
        <div className="mb-3">
          <button type="button" className="btn btn-secondary" onClick={this.toggleQrReader}>{i18next.t("showQrCode")}</button>
        </div>
    }
    let qrcodeJsx;
    if (this.state.qrcode) {
      qrcodeJsx = <img className="img-fluid" src={this.state.qrcode} alt="qrcode" />;
    } else if (this.state.qrCodeError) {
      qrcodeJsx = 
        <div className="alert alert-warning" role="alert">
          {i18next.t("exportShowQrCodeTooLarge")}
        </div>
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
              <div className="accordion" id="secretGeneratorAccordion">
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingOne">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#passwordRandomCharacters" aria-expanded="true" aria-controls="passwordRandomCharacters">
                      {i18next.t("passwordRandomCharacters")}
                    </button>
                  </h2>
                  <div id="passwordRandomCharacters" className="accordion-collapse collapse show" data-bs-parent="#secretGeneratorAccordion">
                    <div className="accordion-body">
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="lowercase" onChange={(e) => this.toggleParam(e, "lowercase")} checked={this.state.element.params.lowercase} />
                        <label className="form-check-label" htmlFor="lowercase">{i18next.t("passwordRandomLowercase")}</label>
                      </div>
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="upprcase" onChange={(e) => this.toggleParam(e, "upprcase")} checked={this.state.element.params.upprcase} />
                        <label className="form-check-label" htmlFor="upprcase">{i18next.t("passwordRandomUppercase")}</label>
                      </div>
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="numbers" onChange={(e) => this.toggleParam(e, "numbers")} checked={this.state.element.params.numbers} />
                        <label className="form-check-label" htmlFor="numbers">{i18next.t("passwordRandomNumbers")}</label>
                      </div>
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="special" onChange={(e) => this.toggleParam(e, "special")} checked={this.state.element.params.special} />
                        <label className="form-check-label" htmlFor="special">{i18next.t("passwordRandomSpecial")}</label>
                      </div>
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="spaces" onChange={(e) => this.toggleParam(e, "spaces")} checked={this.state.element.params.spaces} />
                        <label className="form-check-label" htmlFor="spaces">{i18next.t("passwordRandomSpaces")}</label>
                      </div>
                      <div className="form-group form-check">
                        <input type="checkbox" className="form-check-input" id="noSimilarFollowingChars" onChange={(e) => this.toggleParam(e, "noSimilarFollowingChars")} checked={this.state.element.params.noSimilarFollowingChars} />
                        <label className="form-check-label" htmlFor="noSimilarFollowingChars">{i18next.t("passwordNoSimilarFollowingChars")}</label>
                      </div>
                      <div className="mb-3">
                        <label htmlFor="passwordCharLength" className="form-label">{i18next.t("passwordCharLength")}</label>
                        <input type="number" step="1" min="0" className="form-control" id="passwordCharLength" value={this.state.element.params.passwordCharLength} onChange={this.changePasswordLength}/>
                      </div>
                      <div className="mb-3">
                        <button type="button" className="btn btn-secondary" onClick={this.generateRandomChars} disabled={(!this.state.element.params.lowercase && !this.state.element.params.upprcase && !this.state.element.params.numbers && !this.state.element.params.special) || !this.state.element.params.passwordCharLength}>{i18next.t("passwordGenerate")}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="accordion-item">
                <h2 className="accordion-header" id="headingTwo">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#passwordRandomWords" aria-expanded="true" aria-controls="passwordRandomWords">
                    {i18next.t("passwordRandomWords")}
                  </button>
                </h2>
                <div id="passwordRandomWords" className="accordion-collapse collapse" data-bs-parent="#secretGeneratorAccordion">
                  <div className="accordion-body">
                    <div className="mb-3">
                      <label htmlFor="passwordWordsNumber" className="form-label">{i18next.t("passwordWordsNumber")}</label>
                      <input type="number" step="1" min="0" className="form-control" id="passwordWordsNumber" value={this.state.element.params.wordsNumber} onChange={this.changePasswordWordsNumber}/>
                    </div>
                    <div className="input-group mb-3">
                      <label className="input-group-text" htmlFor="passwordWordsSeparator">{i18next.t("passwordWordsSeparator")}</label>
                      <select className="form-select" id="passwordWordsSeparator" value={this.state.element.params.wordSeparator} onChange={this.changePasswordWordsSeparator}>
                        <option value=" ">{i18next.t("passwordWordsSeparatorSpace")}</option>
                        <option value=".">{i18next.t("passwordWordsSeparatorDot")}</option>
                        <option value="-">{i18next.t("passwordWordsSeparatorDash")}</option>
                        <option value="_">{i18next.t("passwordWordsSeparatorUnderscore")}</option>
                        <option value=",">{i18next.t("passwordWordsSeparatorComma")}</option>
                        <option value="">{i18next.t("passwordWordsSeparatorNone")}</option>
                      </select>
                    </div>
                    <h5>{i18next.t("passwordWordsLangs")}</h5>
                    {langListJsx}
                    <div className="mb-3">
                      <button type="button" className="btn btn-secondary" onClick={this.generateRandomWords} disabled={!this.state.element.params.wordsNumber || !this.state.element.params.wordsLangsList.length}>{i18next.t("passwordGenerate")}</button>
                    </div>
                  </div>
                </div>
              </div>
              {keyGeneratorJsx}
              <div className="accordion-item">
                <h2 className="accordion-header" id="headingThree">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#qrReader" aria-expanded="true" aria-controls="qrReader">
                    {i18next.t("importQrCode")}
                  </button>
                </h2>
                <div id="qrReader" className="accordion-collapse collapse" data-bs-parent="#secretGeneratorAccordion">
                  <div className="accordion-body">
                    {qrReaderBodyJsx}
                  </div>
                </div>
              </div>
              <hr/>
              <div className="mb-3">
                {passwordOutput}
              </div>
              <div className="mb-3">
                <div className="btn-toolbar justify-content-between" role="toolbar">
                  <div className="btn-group" role="group">
                    <button className="btn btn-outline-secondary" type="button" onClick={this.toggleShowPassword} title={i18next.t("coinElementShowPassword")} disabled={!this.state.passwordGenerated && !this.state.qrcodeImported}>
                      <i className="fa fa-eye" aria-hidden="true"></i>
                    </button>
                    <button className="btn btn-outline-secondary" type="button" onClick={this.showQrCode} title={i18next.t("coinElementShowQrCode")} disabled={!this.state.passwordGenerated && !this.state.qrcodeImported}>
                      <i className="fa fa-qrcode" aria-hidden="true"></i>
                    </button>
                    <button className="btn btn-outline-secondary" type="button" onClick={this.copyNewPassword} title={i18next.t("passwordCopyNewPassword")} disabled={!this.state.passwordGenerated && !this.state.qrcodeImported}>
                      <i className="fa fa-files-o" aria-hidden="true"></i>
                    </button>
                  </div>
                  <div className="btn-group" role="group">
                    <button className="btn btn-outline-secondary" type="button" onClick={this.copyOriginalPassword} title={i18next.t("passwordCopyOriginalPassword")} disabled={!this.state.originalPassword}>
                      <i className="fa fa-files-o" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
                {qrcodeJsx}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)}>{i18next.t("modalClose")}</button>
              {hideSaveAndCloseJsx}
            </div>
          </div>
        </div>
      </div>
		);
	}
}

export default ModalGeneratePassword;
