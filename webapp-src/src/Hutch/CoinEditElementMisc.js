import React, { Component } from 'react';

import i18next from 'i18next';

class CoinEditElementMisc extends Component {
  constructor(props) {
    super(props);

    this.state = {
      coin: props.coin,
      element: props.element,
      index: props.index,
      cbSave: props.cbSave,
      cbCancel: props.cbCancel,
      isDraggable: props.isDraggable,
      cbOnDragStart: props.cbOnDragStart,
      cbOnDragOver: props.cbOnDragOver
    };
    
    this.changeValue = this.changeValue.bind(this);
    this.changeHide = this.changeHide.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  changeValue(e) {
    var element = this.state.element;
    element.value = e.target.value;
    this.setState({element: element});
  }
  
  changeHide() {
    var element = this.state.element;
    element.hide = !element.hide;
    this.setState({element: element});
  }

	render() {
    return (
      <div draggable={this.state.isDraggable} onDragStart={this.state.cbOnDragStart} onDragOver={this.state.cbOnDragOver} id={this.state.coin.name+"-"+this.state.index} className="border border-secondary rounded coin-element">
        <form onSubmit={(e) => this.state.cbSave(e, this.state.element, this.state.index)}>
          <div className="mb-3">
            <label htmlFor={this.state.coin.name+"-"+this.state.index} className="form-label">{i18next.t("coinElementMisc")}</label>
            <textarea className="form-control"
                      id={this.state.coin.name+"-"+this.state.index}
                      value={this.state.element.value}
                      placeholder={i18next.t("coinElementMiscPh")}
                      onChange={this.changeValue}>
            </textarea>
          </div>
          <div className="mb-3">
            <input className="form-check-input btn-icon"
                   type="checkbox"
                   id={this.state.coin.name+"-"+this.state.index+"-hide"}
                   onChange={this.changeHide}
                   checked={!!this.state.element.hide} />
            <label className="form-check-label" htmlFor={this.state.coin.name+"-"+this.state.index+"-hide"}>
              {i18next.t("coinElementHide")}
            </label>
          </div>
          <div className="mb-3 btn-group">
            <button type="button" className="btn btn-secondary" onClick={(e) => this.state.cbCancel(e, this.state.index)}>{i18next.t("modalClose")}</button>
            <button type="submit" className="btn btn-primary" onClick={(e) => this.state.cbSave(e, this.state.element, this.state.index)} disabled={!this.state.element.value}>{i18next.t("modalOk")}</button>
          </div>
        </form>
      </div>
    );
	}
}

export default CoinEditElementMisc;
