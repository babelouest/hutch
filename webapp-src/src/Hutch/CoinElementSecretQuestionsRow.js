import React, { Component } from 'react';

import i18next from 'i18next';

class CoinElementSecretQuestionsRow extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value,
      index: props.index,
      cbSave: props.cbSave,
      disableEdit: props.disableEdit,
      showAnswer: false
    };
    
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.toggleShowAnswer = this.toggleShowAnswer.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  copyToClipboard() {
    navigator.clipboard.writeText(this.state.value.answer).then(() => {
      $.snack("info", i18next.t("messageCopyToClipboard"));
    });
  }
  
  toggleShowAnswer() {
    this.setState({showAnswer: !this.state.showAnswer});
  }
  
	render() {
    var answer;
    if (this.state.value.answer.length > 4 && !this.state.showAnswer) {
      answer = this.state.value.answer.substring(0, 2)+"[...]"+this.state.value.answer.slice(-2);
    } else {
      answer = this.state.value.answer;
    }
    return (
      <div className="row">
        <div className="col">
          <span className="badge bg-info text-dark">
            {i18next.t("coinElementQuestionQ")}
          </span>
          <code className="btn-icon-right">
            {this.state.value.question}
          </code>
        </div>
        <div className="col">
          <span className="badge bg-info text-dark">
            {i18next.t("coinElementQuestionA")}
          </span>
          <code className="btn-icon-right">
            {answer}
          </code>
        </div>
        <div className="col">
          <div className="btn-group float-end btn-icon" role="group">
            <button type="button" className="btn btn-outline-secondary btn-sm" title={i18next.t("coinElementShowAnswer")} onClick={this.toggleShowAnswer}>
              <i className="fa fa-eye" aria-hidden="true"></i>
            </button>
            <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementCopy")} onClick={this.copyToClipboard}>
              <i className="fa fa-files-o" aria-hidden="true"></i>
            </button>
            <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementEdit")} onClick={(e) => this.state.cbEdit(e, this.state.index)} disabled={this.state.disableEdit}>
              <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
            </button>
            <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementRemove")} onClick={(e) => this.state.cbRemove(e, this.state.index)}>
              <i className="fa fa-trash-o" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>
    );
	}
}

export default CoinElementSecretQuestionsRow;
