import React, { Component } from 'react';

import i18next from 'i18next';

import messageDispatcher from '../lib/MessageDispatcher';

class CoinElementPassword extends Component {
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
      showPassword: false
    };
    
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.toggleShowPassword = this.toggleShowPassword.bind(this);
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
  
  toggleShowPassword(e) {
    e.preventDefault();
    this.setState({showPassword: !this.state.showPassword});
  }
  
  showQrCode() {
    messageDispatcher.sendMessage('App', {action: 'showQrCode', value: this.state.element.value, metaData: this.state.coin.data.displayName + " - " + i18next.t("coinElementPassword")});
  }

	render() {
    let tagListJsx = [], passwordJsx, passwordSmJsx;
    this.state.element.tags && this.state.element.tags.forEach((tag, index) => {
      tagListJsx.push(<span key={index} className="badge rounded-pill bg-secondary btn-icon">{tag}</span>);
    });
    if (this.state.showPassword) {
      passwordJsx = 
        <div className="col">
          <code className="d-none d-md-block">
            {this.state.element.value}
          </code>
        </div>
        passwordSmJsx =
        <div className="row d-md-none coin-tag">
          <div className="col">
            <code>
              {this.state.element.value}
            </code>
          </div>
        </div>
    } else {
      passwordJsx =
        <div className="col text-truncate">
          <span className="btn-icon-right">
            ********
          </span>
        </div>
    }
    return (
        <div draggable={this.state.isDraggable} onDragStart={this.state.cbOnDragStart} onDragOver={this.state.cbOnDragOver} id={this.state.coin.name+"-"+this.state.index} className="border border-secondary rounded coin-element">
          <div className="row btn-icon-bottom">
            <div className="col text-truncate d-none d-md-block">
              <span className="btn-icon-right">
                <span className="badge bg-primary">
                  <i className="fa fa-key btn-icon" aria-hidden="true"></i>
                  {i18next.t("coinElementPassword")}
                </span>
              </span>
              <a className="link-secondary btn-icon-right" alt={i18next.t("coinElementShowPassword")} href="#" onClick={this.toggleShowPassword}>
                <i className="fa fa-eye" aria-hidden="true"></i>
              </a>
            </div>
            <div className="col d-md-none">
              <span className="btn-icon-right">
                <span className="badge bg-primary">
                  <i className="fa fa-key" aria-hidden="true"></i>
                </span>
              </span>
              <a className="link-secondary btn-icon-right" alt={i18next.t("coinElementShowPassword")} href="#" onClick={this.toggleShowPassword}>
                <i className="fa fa-eye" aria-hidden="true"></i>
              </a>
            </div>
            {passwordJsx}
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
          {passwordSmJsx}
        </div>
    );
	}
}

export default CoinElementPassword;
