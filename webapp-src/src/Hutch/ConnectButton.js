import React, { Component } from 'react';

import i18next from 'i18next';

import oidcConnector from '../lib/OIDCConnector';

class ConnectButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: props.status
    };
  }
  
  static getDerivedStateFromProps(props, state) {
    return props;
  }

  logOut() {
    oidcConnector.disconnect();
  }
  
  logIn() {
    oidcConnector.connect();
  }

	render() {
    if (this.state.status === "connecting") {
      return <a className="nav-link" onClick={this.logIn} href="#">{i18next.t("connecting")}</a>;
    } else if (this.state.status === "connected") {
      return <a className="nav-link" onClick={this.logOut} href="#">{i18next.t("log_out")}</a>;
    } else {
      return <a className="nav-link" onClick={this.logIn} href="#">{i18next.t("log_in")}</a>;
    }
	}
}

export default ConnectButton;
