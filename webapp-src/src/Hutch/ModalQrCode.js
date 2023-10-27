import React, { Component } from 'react';
import qrcode from 'qrcode-generator';

import i18next from 'i18next';

import ManageExportData from './ManageExportData';

class ModalQrCode extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cb: props.cb,
      metaData: props.metaData,
      data: props.data
    };
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

	render() {
    let qr = qrcode(0, 'L'), qrJsx;
    if (this.state.data.value.length < 23648) {
      qr.addData(this.state.data.value);
      qr.make();
      qrJsx = <img className="img-fluid" src={qr.createDataURL(4)} alt="qrcode" />
    } else {
      qrJsx = 
        <div className="alert alert-warning" role="alert">
          {i18next.t("exportShowQrCodeTooLarge")}
        </div>
    }
    return (
      <div className="modal" tabIndex="-1" id="qrCodeModal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{i18next.t("coinElementShowQrCode")}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={(e) => this.state.cb(e)}></button>
            </div>
              <div className="modal-body">
                <div className="text-center">
                  <h6>{this.state.data.metaData}</h6>
                  {qrJsx}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={(e) => this.state.cb(e)}>{i18next.t("modalClose")}</button>
              </div>
          </div>
        </div>
      </div>
    );
	}
}

export default ModalQrCode;
