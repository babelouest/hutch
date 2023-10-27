import React, { Component } from 'react';

import i18next from 'i18next';

import messageDispatcher from '../lib/MessageDispatcher';

class CoinElementMisc extends Component {
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
      cbOnDragOver: props.cbOnDragOver,
      showElement: false
    };
    
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.toggleShowValue = this.toggleShowValue.bind(this);
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
  
  toggleShowValue(e) {
    e.preventDefault();
    this.setState({showElement: !this.state.showElement});
  }
  
  showQrCode() {
    messageDispatcher.sendMessage('App', {action: 'showQrCode', value: this.state.element.value, metaData: this.state.coin.data.displayName + " - " + i18next.t("coinElementMisc")});
  }

	render() {
    var tagListJsx = [];
    this.state.element.tags && this.state.element.tags.forEach((tag, index) => {
      tagListJsx.push(<span key={index} className="badge rounded-pill bg-secondary btn-icon">{tag}</span>);
    });
    var valueJsx, valueSmJsx, showIcon;
    if (this.state.element.hide) {
      if (this.state.showElement) {
        valueJsx = 
          <div className="col">
            <span className="btn-icon-right">
              <pre className="d-none d-md-block">
                {this.state.element.value}
              </pre>
            </span>
          </div>
        valueSmJsx =
        <div className="row d-md-none coin-tag">
          <div className="col">
            <pre>
              {this.state.element.value}
            </pre>
          </div>
        </div>
      } else {
        valueJsx =
          <div className="col text-truncate">
            <span className="btn-icon-right">
              ********
            </span>
          </div>
      }
      showIcon = 
        <a className="link-secondary btn-icon-right" alt={i18next.t("coinElementShow")} href="#" onClick={this.toggleShowValue}>
          <i className="fa fa-eye" aria-hidden="true"></i>
        </a>
    } else {
      valueJsx = 
        <div className="col">
          <span className="btn-icon-right">
            <pre>{this.state.element.value}</pre>
          </span>
        </div>
    }
    return (
        <div draggable={this.state.isDraggable} onDragStart={this.state.cbOnDragStart} onDragOver={this.state.cbOnDragOver} id={this.state.coin.name+"-"+this.state.index} className="border border-secondary rounded coin-element">
          <div className="row btn-icon-bottom">
            <div className="col d-none d-md-block">
              <span className="btn-icon-right">
                <span className="badge bg-primary">
                  <i className="fa fa-clone btn-icon" aria-hidden="true"></i>
                  {i18next.t("coinElementMisc")}
                </span>
              </span>
              {showIcon}
            </div>
            <div className="col d-md-none">
              <span className="btn-icon-right">
                <span className="badge bg-primary">
                  <i className="fa fa-clone" aria-hidden="true"></i>
                </span>
              </span>
              {showIcon}
            </div>
            {valueJsx}
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
          {valueSmJsx}
        </div>
    );
	}
}

export default CoinElementMisc;
