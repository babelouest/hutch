import React, { Component } from 'react';

import i18next from 'i18next';

class CoinEditElementFile extends Component {
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
    
    this.getFile = this.getFile.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  getFile(e) {
    var element = this.state.element;
    var file = e.target.files[0];
    var fr = new FileReader();
    fr.onload = (ev2) => {
      element.value = {filename: file.name, data: btoa(ev2.target.result)};
      this.setState({element: element});
    };
    fr.readAsBinaryString(file);
  }

	render() {
    var filenameJsx;
    if (this.state.element.value.filename) {
      filenameJsx = <code className="btn-icon-right">{this.state.element.value.filename}</code>
    }
    return (
      <div draggable={this.state.isDraggable} onDragStart={this.state.cbOnDragStart} onDragOver={this.state.cbOnDragOver} id={this.state.coin.name+"-"+this.state.index}>
        <form onSubmit={(e) => this.state.cbSave(e, this.state.element, this.state.index)}>
          <div className="mb-3">
            <input type="file"
                   className="upload"
                   id={this.state.coin.name+"-"+this.state.index}
                   onChange={this.getFile} />
            <label htmlFor={this.state.coin.name+"-"+this.state.index} className="btn btn-outline-secondary btn-sm">
              <i className="fa fa-cloud-upload" aria-hidden="true"></i>
            </label>
            {filenameJsx}
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

export default CoinEditElementFile;
