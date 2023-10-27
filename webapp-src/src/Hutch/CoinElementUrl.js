import React, { Component } from 'react';

import i18next from 'i18next';

import messageDispatcher from '../lib/MessageDispatcher';

class CoinElementUrl extends Component {
  constructor(props) {
    super(props);

    this.state = {
      coin: props.coin,
      oidcStatus: props.oidcStatus,
      element: props.element,
      index: props.index,
      cbEdit: props.cbEdit,
      cbRemove: props.cbRemove,
      cbTags: props.cbTags,
      isDraggable: props.isDraggable,
      cbOnDragStart: props.cbOnDragStart,
      cbOnDragOver: props.cbOnDragOver
    };
    
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.showQrCode = this.showQrCode.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  copyToClipboard() {
    navigator.clipboard.writeText(this.state.element.value).then(() => {
      messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageCopyToClipboard")});
    });
  }
  
  showQrCode() {
    messageDispatcher.sendMessage('App', {action: 'showQrCode', value: this.state.element.value, metaData: this.state.coin.data.displayName + " - " + i18next.t("coinElementUrl")});
  }

	render() {
    var tagListJsx = [];
    this.state.element.tags && this.state.element.tags.forEach((tag, index) => {
      tagListJsx.push(<span key={index} className="badge rounded-pill bg-secondary btn-icon">{tag}</span>);
    });
    return (
        <div draggable={this.state.isDraggable} onDragStart={this.state.cbOnDragStart} onDragOver={this.state.cbOnDragOver} id={this.state.coin.name+"-"+this.state.index} className="border border-secondary rounded coin-element">
          <div className="row btn-icon-bottom">
            <div className="col d-none d-md-block">
              <span className="btn-icon-right">
                <span className="badge bg-primary">
                  <i className="fa fa-link btn-icon" aria-hidden="true"></i>
                  {i18next.t("coinElementUrl")}
                </span>
              </span>
            </div>
            <div className="col d-md-none">
              <span className="btn-icon-right">
                <span className="badge bg-primary">
                  <i className="fa fa-link" aria-hidden="true"></i>
                </span>
              </span>
            </div>
            <div className="col text-truncate">
              <span className="btn-icon-right">
                <a href={this.state.element.value} target="_blank" rel="noreferrer noopener" title={this.state.element.value} className="link-secondary">{this.state.element.value}</a>
              </span>
            </div>
            <div className="col">
              <div className="btn-group float-end btn-icon" role="group">
                <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementCopy")} onClick={this.copyToClipboard}>
                  <i className="fa fa-files-o" aria-hidden="true"></i>
                </button>
              <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementShowQrCode")} onClick={this.showQrCode}>
                <i className="fa fa-qrcode" aria-hidden="true"></i>
              </button>
                <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementEdit")} onClick={(e) => this.state.cbEdit(e, this.state.index)} disabled={this.state.oidcStatus !== "connected"}>
                  <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
                </button>
                <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementRemove")} onClick={(e) => this.state.cbRemove(e, this.state.index)} disabled={this.state.oidcStatus !== "connected"}>
                  <i className="fa fa-trash-o" aria-hidden="true"></i>
                </button>
                <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementTags")} onClick={(e) => this.state.cbTags(e, this.state.index)} disabled={this.state.oidcStatus !== "connected"}>
                  <i className="fa fa-tags" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
          <div className="row coin-tag">
            <div className="col">
              {tagListJsx}
            </div>
          </div>
        </div>
    );
	}
}

export default CoinElementUrl;
