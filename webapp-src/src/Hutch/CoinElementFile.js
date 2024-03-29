import React, { Component } from 'react';

import i18next from 'i18next';

import messageDispatcher from '../lib/MessageDispatcher';

class CoinElementFile extends Component {
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
    
    this.downloadFile = this.downloadFile.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  downloadFile() {
    if (this.state.element.value.data) {
      var $anchor = $("#"+this.state.coin.name+"-"+this.state.index+"-download");
      $anchor.attr("href", "data:application/octet-stream;base64,"+this.state.element.value.data);
      $anchor[0].click();
    }
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
                  <i className="fa fa-file btn-icon" aria-hidden="true"></i>
                  {i18next.t("coinElementFile")}
                </span>
              </span>
            </div>
            <div className="col d-md-none">
              <span className="btn-icon-right">
                <span className="badge bg-primary">
                  <i className="fa fa-file" aria-hidden="true"></i>
                </span>
              </span>
            </div>
            <div className="col text-truncate">
              <span className="btn-icon-right">
                <code>{this.state.element.value.name}</code>
              </span>
            </div>
            <div className="col">
              <div className="btn-group float-end btn-icon" role="group">
                <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementDownload")} onClick={this.downloadFile}>
                  <i className="fa fa-cloud-download" aria-hidden="true"></i>
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
          <a className="upload" id={this.state.coin.name+"-"+this.state.index+"-download"} download={this.state.element.value.name} />
        </div>
    );
	}
}

export default CoinElementFile;
