import React, { Component } from 'react';

import i18next from 'i18next';

class JwkInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isError: props.isError,
      ph: props.ph,
      cb: props.cb,
      value: "",
      filename: ""
    };
    
    this.changeValue = this.changeValue.bind(this);
    this.getFile = this.getFile.bind(this);
  }
  
  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  changeValue(e) {
    this.setState({value: e.target.value, filename: ""}, () => {
      this.state.cb(this.state.value);
    });
  }
  
  getFile(e) {
    var file = e.target.files[0];
    var fr = new FileReader();
    fr.onload = (ev2) => {
      this.setState({value: ev2.target.result, filename: file.name}, () => {
        this.state.cb(this.state.value);
      });
    };
    fr.readAsText(file);
  }

	render() {
    var className = "form-control", errorMessageJsx;
    if (this.state.isError) {
      className += " is-invalid";
      errorMessageJsx =
        <div className="invalid-feedback">
          {i18next.t("jwkError")}
        </div>
    }
    var filenameJsx;
    if (this.state.filename) {
      filenameJsx = <code className="btn-icon-right">{this.state.filename}</code>
    }
    return (
      <div>
        <div className="input-group">
          <textarea className={className}
                    autoComplete="off"
                    placeholder={this.state.ph}
                    value={this.state.value}
                    onChange={(e) => this.changeValue(e)}></textarea>
          <input type="file"
                 className="upload"
                 id="jwkFile"
                 onChange={this.getFile} />
          <label htmlFor="jwkFile" className="btn btn-outline-secondary btn-sm">
            <i className="fa fa-cloud-upload" aria-hidden="true"></i>
          </label>
          {errorMessageJsx}
        </div>
        {filenameJsx}
      </div>
    );
	}
}

export default JwkInput;
