import React, { Component } from 'react';
import i18next from 'i18next';

class Confirm extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: props.name,
      title: props.title,
      message: props.message,
      cb: props.cb
    }

    this.closeModal = this.closeModal.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

  closeModal(e, result) {
    if (this.state.cb) {
      this.state.cb(result);
    }
  }

	render() {
		return (
      <div className="modal" tabIndex="-1" id={this.state.name}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{this.state.title}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={(e) => this.closeModal(e, false)}></button>
            </div>
            <div className="modal-body">
              <p>
                {this.state.message}
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)}>{i18next.t("modalClose")}</button>
              <button type="button" className="btn btn-primary" onClick={(e) => this.closeModal(e, true)}>{i18next.t("modalOk")}</button>
            </div>
          </div>
        </div>
      </div>
		);
	}
}

export default Confirm;
