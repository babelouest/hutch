import React, { Component } from 'react';
import qrcode from 'qrcode-generator';

import i18next from 'i18next';

import messageDispatcher from '../lib/MessageDispatcher';

class JwkOutput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      private: props.private,
      jwk: props.jwk,
      showQrCode: false
    };
    
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.downloadAsFile = this.downloadAsFile.bind(this);
    this.toggleQrCode = this.toggleQrCode.bind(this);
  }
  
  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  toggleQrCode() {
    this.setState({showQrCode: !this.state.showQrCode});
  }

  copyToClipboard() {
    navigator.clipboard.writeText(JSON.stringify(this.state.jwk)).then(() => {
      messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageCopyToClipboard")});
    });
  }
  
  downloadAsFile() {
    if (this.state.jwk) {
      var $anchor = $("#download-"+(this.state.private?"priv":"pub"));
      $anchor.attr("href", "data:application/octet-stream;base64,"+btoa(JSON.stringify(this.state.jwk)));
      $anchor[0].click();
    }
  }
  
	render() {
    let titleJsx;
    if (this.state.private) {
      titleJsx = <h5>{i18next.t("keyTypePrivate")}</h5>
    } else {
      titleJsx = <h5>{i18next.t("keyTypePublic")}</h5>
    }
    let jwkJsx;
    if (this.state.showQrCode) {
      let qr = qrcode(0, 'L');
      qr.addData(JSON.stringify(this.state.jwk));
      qr.make();
      jwkJsx = <img className="img-fluid" src={qr.createDataURL(4)} alt="qrcode" />
    } else {
     jwkJsx = JSON.stringify(this.state.jwk, null, 2);
    }
    return (
      <div>
        <div>
          {titleJsx}
          <div className="btn-group float-end btn-icon">
            <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementCopy")} onClick={this.copyToClipboard}>
              <i className="fa fa-files-o" aria-hidden="true"></i>
            </button>
            <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementDownload")} onClick={this.downloadAsFile}>
              <i className="fa fa-cloud-download" aria-hidden="true"></i>
            </button>
            <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementShowQrCode")} onClick={this.toggleQrCode}>
              <i className="fa fa-qrcode" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <pre>
          {jwkJsx}
        </pre>
        <a className="upload" id={"download-"+(this.state.private?"priv":"pub")} download={(this.state.private?"private.jwk":"public.jwk")} />
      </div>
    );
	}
}

export default JwkOutput;
