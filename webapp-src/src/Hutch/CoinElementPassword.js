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
  
	render() {
    var tagListJsx = [];
    this.state.element.tags && this.state.element.tags.forEach((tag, index) => {
      tagListJsx.push(<span key={index} className="badge rounded-pill bg-secondary btn-icon">{tag}</span>);
    });
    var password;
    if (this.state.showPassword) {
      password = 
        <code>
          {this.state.element.value}
        </code>
    } else {
      password =
        <span className="btn-icon-right">
          ********
        </span>
    }
    return (
        <div draggable={this.state.isDraggable} onDragStart={this.state.cbOnDragStart} onDragOver={this.state.cbOnDragOver} id={this.state.coin.name+"-"+this.state.index}>
          <div className="row btn-icon-bottom">
            <div className="col text-truncate">
              <span className="btn-icon-right">
                <span className="badge bg-primary">
                  {i18next.t("coinElementPassword")}
                </span>
              </span>
            </div>
            <div className="col text-truncate">
              {password}
            </div>
            <div className="col">
              <div className="btn-group float-end btn-icon" role="group">
                <button type="button" className="btn btn-outline-secondary btn-sm" title={i18next.t("coinElementShowPassword")} onClick={this.toggleShowPassword}>
                  <i className="fa fa-eye" aria-hidden="true"></i>
                </button>
                <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementCopy")} onClick={this.copyToClipboard}>
                  <i className="fa fa-files-o" aria-hidden="true"></i>
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
          <div className="row">
            <div className="col">
              {tagListJsx}
            </div>
          </div>
        </div>
    );
	}
}

export default CoinElementPassword;
