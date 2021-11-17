import React, { Component } from 'react';

import i18next from 'i18next';

import oidcConnector from '../lib/OIDCConnector';
import storage from '../lib/Storage';

import LangDropdown from './LangDropdown';

class Config extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      longSession: !!storage.getValue("longSession")
    };

    this.toggleLongSession = this.toggleLongSession.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

  toggleLongSession(e) {
    this.setState({longSession: !this.state.longSession}, () => {
      storage.setValue("longSession", this.state.longSession);
      oidcConnector.setParameter("responseType", this.state.longSession?"code":"token id_token");
    });
  }

	render() {
    return (
      <div>
        <hr/>
        <div>
          <h3>
            {i18next.t("selectLang")}
          </h3>
          <LangDropdown config={this.state.config}/>
        </div>
        <hr/>
        <div>
          <h3>
            {i18next.t("selectSession")}
          </h3>
          <div className="form-check">
            <input className="form-check-input" type="checkbox" checked={this.state.longSession} id="longSession" onChange={(e) => this.toggleLongSession(e)} />
            <label className="form-check-label" htmlFor="longSession">
              {i18next.t("longSession")}
            </label>
          </div>
          <p className="fs-6 fst-italic">
            {i18next.t("selectSessionWarning")}
          </p>
        </div>
      </div>
    );
	}
}

export default Config;
