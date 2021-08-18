import React, { Component } from 'react';

import i18next from 'i18next';

import LangDropdown from './LangDropdown';
import ConnectButton from './ConnectButton';

import messageDispatcher from '../lib/MessageDispatcher';
import routage from '../lib/Routage';

class TopMenu extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      oidcStatus: props.oidcStatus,
      safeList: props.safeList,
      safeContent: props.safeContent
    };
    
    this.navigateTo = this.navigateTo.bind(this);
    this.addSafe = this.addSafe.bind(this);
  }
  
  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  navigateTo(e, safe) {
    e.preventDefault();
    routage.addRoute(safe||"");
    messageDispatcher.sendMessage("App", {action: 'nav', target: safe});
  }
  
  addSafe(e) {
    e.preventDefault();
    messageDispatcher.sendMessage("App", {action: 'addSafe'});
  }

	render() {
    var safeListJsx = [], addSafeJsx;
    this.state.safeList.forEach((safe, index) => {
      var safeIconJsx;
      if (this.state.safeContent && this.state.safeContent[safe.name] && this.state.safeContent[safe.name].key) {
        safeIconJsx = <i className="fa fa-unlock btn-icon-right" aria-hidden="true"></i>;
      } else {
        safeIconJsx = <i className="fa fa-lock btn-icon-right" aria-hidden="true"></i>;
      }
      safeListJsx.push(
        <li className="nav-item" key={index}>
          <a className="nav-link active"
              data-bs-toggle="collapse"
              data-bs-target=".navbar-collapse.show"
              href="#" aria-current="page"
              onClick={(e) => this.navigateTo(e, safe.name)}>
            {safe.display_name||safe.name}
            {safeIconJsx}
          </a>
        </li>
      );
    });
    if (this.state.oidcStatus === "connected") {
      addSafeJsx =
        <li className="nav-item">
          <a className="nav-link active"
             data-bs-toggle="collapse"
             data-bs-target=".navbar-collapse.show"
             aria-current="page" href="#"
             onClick={this.addSafe}>{i18next.t("addSafe")}</a>
        </li>
    }
    return (
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <a className="navbar-brand"
             href="#"
             onClick={(e) => this.navigateTo(e, false)}>
            Hutch
          </a>
          <button className="navbar-toggler"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#navbarNav"
                  aria-controls="navbarNav"
                  aria-expanded="false"
                  aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              {safeListJsx}
              {addSafeJsx}
            </ul>
            <ul className="navbar-nav ms-auto flex-nowrap text-right">
              <LangDropdown config={this.state.config}/>
              <li className="nav-item">
                <ConnectButton status={this.state.oidcStatus}/>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    );
	}
}

export default TopMenu;
