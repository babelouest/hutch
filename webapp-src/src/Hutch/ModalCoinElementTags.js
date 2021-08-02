import React, { Component } from 'react';

import i18next from 'i18next';

class ModalCoinElementTags extends Component {
  constructor(props) {
    super(props);

    this.state = {
      index: props.index,
      tags: props.tags,
      cb: props.cb,
      inputValue: ""
    };
    
    this.addTag = this.addTag.bind(this);
    this.deleteTag = this.deleteTag.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.changeInputValue = this.changeInputValue.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

  closeModal(e, result) {
    if (this.state.cb) {
      this.state.cb(result, this.state.tags);
    }
  }
  
  changeInputValue(e) {
    if (/\s/.test(e.target.value)) {
      this.addTag()
    } else {
      this.setState({inputValue: e.target.value});
    }
  }
  
  addTag() {
    var tags = this.state.tags;
    if (this.state.inputValue) {
      tags.push(this.state.inputValue);
    }
    return this.setState({tags: tags, inputValue: ""});
  }
  
  deleteTag(e, index) {
    e.preventDefault();
    var tags = this.state.tags;
    tags.splice(index, 1);
    this.setState({tags: tags});
  }
  
  submitForm(e) {
    e.preventDefault();
    var tags = this.state.tags;
    if (this.state.inputValue) {
      tags.push(this.state.inputValue);
    }
    this.setState({tags: tags, inputValue: ""}, () => {
      this.closeModal(e, true);
    });
  }

	render() {
    var tagsListJsx = [];
    this.state.tags.forEach((tag, index) => {
      tagsListJsx.push(
        <a href="#" onClick={(e) => this.deleteTag(e, index)} key={index}>
          <span className="badge rounded-pill bg-secondary btn-icon">
            {tag}
            <span className="badge badge-light btn-icon-right">
            <i className="fas fa-times"></i>
            </span>
          </span>
        </a>
      );
    });
    return (
      <div className="modal" tabIndex="-1" id="modalCoinElementTags">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{i18next.t("CoinElementTags")}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={(e) => this.closeModal(e, false)}></button>
            </div>
            <form onSubmit={(e) => this.submitForm(e)}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="coinDisplayName" className="form-label">{i18next.t("coinDisplayName")}</label>
                  <div className="input-group mb-3">
                    <input type="text"
                           maxLength="128"
                           className="form-control"
                           id="coinDisplayName"
                           value={this.state.inputValue}
                           onChange={(e) => this.changeInputValue(e)} />
                    <button className="btn btn-outline-secondary" type="button" onClick={this.addTag}>
                      <i className="fa fa-plus" aria-hidden="true"></i>
                    </button>
                  </div>
                  {tagsListJsx}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)}>{i18next.t("modalClose")}</button>
                <button type="submit" className="btn btn-primary" onClick={(e) => this.submitForm(e)}>{i18next.t("modalOk")}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
	}
}

export default ModalCoinElementTags;
