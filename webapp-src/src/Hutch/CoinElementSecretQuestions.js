import React, { Component } from 'react';

import i18next from 'i18next';

import CoinElementSecretQuestionsRow from './CoinElementSecretQuestionsRow';
import CoinElementSecretQuestionsRowEdit from './CoinElementSecretQuestionsRowEdit';

class CoinElementSecretQuestions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      coin: props.coin,
      element: props.element,
      index: props.index,
      closeButon: props.closeButon,
      editList: [],
      cbRemove: props.cbRemove,
      cbSave: props.cbSave,
      cbTags: props.cbTags
    };
    
    this.copyToClipboard = this.copyToClipboard.bind(this);
    this.saveRow = this.saveRow.bind(this);
    this.cancelRow = this.cancelRow.bind(this);
    this.editRow = this.editRow.bind(this);
    this.removeRow = this.removeRow.bind(this);
    this.cbAddQuestion = this.cbAddQuestion.bind(this);

  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  copyToClipboard(index) {
    navigator.clipboard.writeText(this.state.element.value[index].answer).then(() => {
      $.snack("info", i18next.t("messageCopyToClipboard"));
    });
  }
  
  saveRow(e, row, index) {
    var element = this.state.element;
    if (element.value[index]) {
      element.value[index] = row;
    } else {
      element.value.push(row);
    }
    var editList = this.state.editList;
    if (editList.indexOf(index) !== -1) {
      editList.splice(editList.indexOf(index), 1);
    }
    this.setState({element: element, editList: editList}, () => {
      this.state.cbSave(e, this.state.element, this.state.index)
    });
  }
  
  cancelRow(e, index) {
    var editList = this.state.editList;
    if (editList.indexOf(index) !== -1) {
      editList.splice(editList.indexOf(index), 1);
    }
    this.setState({editList: editList});
  }
  
  editRow(e, index) {
    var editList = this.state.editList;
    editList.push(index);
    this.setState({editList: editList});
  }
  
  removeRow(e, index) {
    var element = this.state.element;
    element.value.splice(index, 1);
    var editList = this.state.editList;
    if (editList.indexOf(index) !== -1) {
      editList.splice(editList.indexOf(index), 1);
    }
    this.setState({editList: editList, element: element}, () => {
      this.state.cbSave(e, this.state.element, this.state.index)
    });
  }
  
  cbAddQuestion() {
    var editList = this.state.editList;
    var element = this.state.element;
    editList.push(element.value.length);
    element.value.push({question: "", answer: ""});
    this.setState({editList: editList, element: element});
  }
  
	render() {
    var tagListJsx = [], questionList = [], closeButtonJsx;
    this.state.element.tags && this.state.element.tags.forEach((tag, index) => {
      tagListJsx.push(<span key={index} className="badge rounded-pill bg-secondary btn-icon">{tag}</span>);
    });
    if (!this.state.element.value.length) {
      questionList.push(
        <CoinElementSecretQuestionsRowEdit value={{question: "", answer: ""}} index={0} wordsList={this.state.config.wordsList} cbSave={this.saveRow} cbCancel={this.cancelRow} key={-1}/>
      );
    } else {
      this.state.element.value.forEach((value, index) => {
        if (this.state.editList.indexOf(index) !== -1) {
          questionList.push(
            <CoinElementSecretQuestionsRowEdit value={Object.assign({}, value)} index={index} wordsList={this.state.config.wordsList} cbSave={this.saveRow} cbCancel={this.cancelRow} key={index}/>
          );
        } else {
          questionList.push(
            <CoinElementSecretQuestionsRow value={Object.assign({}, value)} index={index} cbEdit={(e) => this.editRow(e, index)} cbRemove={(e) => this.removeRow(e, index)} key={index} disableEdit={!!this.state.editList.length}/>
          );
        }
      });
    }
    if (this.state.closeButon) {
      closeButtonJsx =
        <div className="row">
          <div className="col">
            <div className="btn-group float-end btn-icon" role="group">
              <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("modalClose")} onClick={(e) => this.state.cbSave(e, this.state.element, this.state.index)}>
                {i18next.t("modalClose")}
              </button>
            </div>
          </div>
        </div>
    }
    return (
      <div>
        <div className="row btn-icon-bottom">
          <div className="col">
            <span className="btn-icon-right">
              <span className="badge bg-primary">
                {i18next.t("coinElementSecretQuestions")}
              </span>
            </span>
          </div>
          <div className="col">
            <div className="btn-group float-end btn-icon" role="group">
              <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementAddQuestion")} onClick={this.cbAddQuestion} disabled={this.state.editList.length}>
                <i className="fa fa-plus" aria-hidden="true"></i>
              </button>
              <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementRemove")} onClick={(e) => this.state.cbRemove(e, this.state.index)}>
                <i className="fa fa-trash-o" aria-hidden="true"></i>
              </button>
              <button className="btn btn-outline-secondary btn-sm" type="button" title={i18next.t("coinElementTags")} onClick={(e) => this.state.cbTags(e, this.state.index)}>
                <i className="fa fa-tags" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </div>
        {questionList}
        <div className="row">
          <div className="col">
            {tagListJsx}
          </div>
        </div>
        {closeButtonJsx}
      </div>
    );
	}
}

export default CoinElementSecretQuestions;
