import React, { Component } from 'react';

import i18next from 'i18next';

import messageDispatcher from '../lib/MessageDispatcher';

class CoinElementSecretQuestionsRow extends Component {
  constructor(props) {
    super(props);

    this.state = {
      oidcStatus: props.oidcStatus,
      value: props.value,
      index: props.index,
      cbSave: props.cbSave,
      disableEdit: props.disableEdit,
      showAnswer: false
    };
    
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.toggleShowAnswer = this.toggleShowAnswer.bind(this);
    this.showQrCode = this.showQrCode.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  copyToClipboard() {
    navigator.clipboard.writeText(this.state.value.answer).then(() => {
      messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageCopyToClipboard")});
    });
  }
  
  toggleShowAnswer(e) {
    e.preventDefault();
    this.setState({showAnswer: !this.state.showAnswer});
  }
  
  showQrCode() {
    messageDispatcher.sendMessage('App', {action: 'showQrCode', value: this.state.value.answer, metaData: this.state.value.question});
  }

	render() {
    var answerJsx, showJsx;
    if (this.state.value.answer.length > 4) {
      if (!this.state.showAnswer) {
        answerJsx = this.state.value.answer.substring(0, 2)+"[...]"+this.state.value.answer.slice(-2);
      } else {
        answerJsx = this.state.value.answer;
      }
      showJsx = 
        <a className="link-secondary btn-icon-right" href="#" alt={i18next.t("coinElementShowAnswer")} onClick={this.toggleShowAnswer}>
          <i className="fa fa-eye" aria-hidden="true"></i>
        </a>
    } else {
      answerJsx = this.state.value.answer;
    }
    return (
      <div className="row">
        <div className="col">
          <code className="btn-icon-right">
            {this.state.value.question}
          </code>
          {showJsx}
        </div>
        <div className="col">
          <code className="btn-icon-right">
            {answerJsx}
          </code>
        </div>
        <div className="col">
          <div className="btn-group float-end btn-icon" role="group">
            <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementCopy")} onClick={this.copyToClipboard}>
              <i className="fa fa-files-o" aria-hidden="true"></i>
            </button>
              <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementShowQrCode")} onClick={this.showQrCode}>
                <i className="fa fa-qrcode" aria-hidden="true"></i>
              </button>
            <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementEdit")} onClick={(e) => this.state.cbEdit(e, this.state.index)} disabled={this.state.disableEdit} disabled={this.state.oidcStatus !== "connected"}>
              <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
            </button>
            <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementRemove")} onClick={(e) => this.state.cbRemove(e, this.state.index)} disabled={this.state.oidcStatus !== "connected"}>
              <i className="fa fa-trash-o" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    );
	}
}

export default CoinElementSecretQuestionsRow;
