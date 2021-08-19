import React, { Component } from 'react';

import i18next from 'i18next';

import messageDispatcher from '../lib/MessageDispatcher';

class CoinElementSecretQuestionsRowEdit extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value,
      index: props.index,
      wordsList: props.wordsList,
      cbSave: props.cbSave,
      cbCancel: props.cbCancel
    };
    this.changeQuestion = this.changeQuestion.bind(this);
    this.changeAnswer = this.changeAnswer.bind(this);
    this.generateAnswer = this.generateAnswer.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  changeQuestion(e) {
    var value = this.state.value;
    value.question = e.target.value;
    this.setState({value: value});
  }
  
  changeAnswer(e) {
    var value = this.state.value;
    value.answer = e.target.value;
    this.setState({value: value});
  }
  
  randomWordsRangeList(length, max) {
    var values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    for (var i=0; i<length; i++) {
      while (values[i] >= max) {
        var newValue = new Uint32Array(1);
        window.crypto.getRandomValues(newValue);
        values[i] = newValue[0];
      }
    }
    return values;
  }
  
  generateAnswer() {
    var valuesArray = this.randomWordsRangeList(2, this.state.wordsList.length);
    var answer = this.state.wordsList[valuesArray[0]] + " " + this.state.wordsList[valuesArray[1]];
    var value = this.state.value;
    value.answer = answer;
    this.setState({value: value});
  }

	render() {
    return (
      <div>
        <div className="row">
          <div className="col">
            <div className="input-group mb-3">
              <span className="input-group-text" id="basic-addon1">
                {i18next.t("coinElementQuestionQ")}
              </span>
              <input type="text" className="form-control" placeholder={i18next.t("coinElementQuestionQPH")} value={this.state.value.question} onChange={this.changeQuestion}/>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col">
            <div className="input-group mb-3">
              <span className="input-group-text" id="basic-addon1">
                {i18next.t("coinElementQuestionA")}
              </span>
              <input type="text" className="form-control" placeholder={i18next.t("coinElementQuestionAPH")} value={this.state.value.answer} onChange={this.changeAnswer}/>
              <button className="btn btn-outline-secondary" type="button" onClick={this.generateAnswer}>
                <i className="fa fa-magic" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="mb-3 btn-group">
          <button type="button" className="btn btn-secondary" onClick={(e) => this.state.cbCancel(e, this.state.index)}>{i18next.t("modalCancel")}</button>
          <button type="submit" className="btn btn-primary" onClick={(e) => this.state.cbSave(e, this.state.value, this.state.index)} disabled={!this.state.value.answer}>{i18next.t("modalOk")}</button>
        </div>
      </div>
    );
	}
}

export default CoinElementSecretQuestionsRowEdit;
