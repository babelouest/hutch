import React, { Component } from 'react';

import i18next from 'i18next';

import ManageExportData from './ManageExportData';

class ModalCoinExport extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      cb: props.cb,
      safe: props.safe,
      coin: props.coin
    };
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

	render() {
    return (
      <div className="modal" tabIndex="-1" id="exportCoinModal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{i18next.t("exportCoin")}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={(e) => this.state.cb(e)}></button>
            </div>
              <div className="modal-body">
                <ManageExportData config={this.state.config}
                                  safe={this.state.safe}
                                  content={[this.state.coin]}
                                  id={this.state.coin.name}
                                  name={this.state.coin.data.displayName} />
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

export default ModalCoinExport;
