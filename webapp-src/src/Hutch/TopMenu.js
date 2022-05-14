import React, { Component } from 'react';

import i18next from 'i18next';

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
      safeContent: props.safeContent,
      curSafe: props.curSafe,
      hasProfile: props.hasProfile
    };
    
    this.navigateTo = this.navigateTo.bind(this);
  }
  
  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  navigateTo(e, safe, offline = false) {
    e.preventDefault();
    routage.addRoute(safe||"");
    messageDispatcher.sendMessage("App", {action: 'nav', target: safe, offline: offline});
  }
  
  navigateoConfig(e) {
    e.preventDefault();
    messageDispatcher.sendMessage("App", {action: 'config'});
  }
  
  openGenerateModal(e) {
    e.preventDefault();
    messageDispatcher.sendMessage("App", {action: 'generate'});
  }
  
  offlineSafe(e) {
    e.preventDefault();
    messageDispatcher.sendMessage("App", {action: 'offline'});
  }
  
	render() {
    var safeListJsx = [];
    this.state.safeList.forEach((safe, index) => {
      var safeIconJsx;
      if (!safe.offline) {
        if (this.state.safeContent && this.state.safeContent[safe.name] && this.state.safeContent[safe.name].key) {
          safeIconJsx = <i className="fa fa-unlock btn-icon-right" aria-hidden="true"></i>;
        } else {
          safeIconJsx = <i className="fa fa-lock btn-icon-right" aria-hidden="true"></i>;
        }
      } else {
        if (safe.updated) {
          safeIconJsx = <i className="fa fa-paper-plane btn-icon-right" aria-hidden="true"></i>;
        } else {
          safeIconJsx = <i className="fa fa-plane btn-icon-right" aria-hidden="true"></i>;
        }
      }
      let className = "nav-link";
      if (this.state.curSafe.name === safe.name) {
        className += " active"
      }
      safeListJsx.push(
        <li className="nav-item" key={index}>
          <a className={className}
              data-bs-toggle="collapse"
              data-bs-target=".navbar-collapse.show"
              href="#"
              aria-current="page"
              onClick={(e) => this.navigateTo(e, safe.name)}>
            {safe.display_name||safe.name}
            {safeIconJsx}
          </a>
        </li>
      );
    });
    var classAddSafe = "nav-link active";
    if (this.state.oidcStatus !== "connected" || !this.state.hasProfile) {
      classAddSafe += " disabled-cursor";
    }
    return (
      <nav className="navbar navbar-expand-lg nav-pills navbar-light bg-light">
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
            </ul>
            <ul className="navbar-nav ms-auto flex-nowrap text-right">
              <li className="nav-item">
                <a className="nav-link"
                   data-bs-toggle="collapse"
                   data-bs-target=".navbar-collapse.show"
                   href="#"
                   onClick={this.offlineSafe} href="#">
                  <i className="fa fa-plane btn-icon-right" aria-hidden="true"></i>
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link"
                   data-bs-toggle="collapse"
                   data-bs-target=".navbar-collapse.show"
                   href="#"
                   onClick={(e) => this.openGenerateModal(e)} href="#">
                  <i className="fa fa-magic btn-icon-right" aria-hidden="true"></i>
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link"
                   data-bs-toggle="collapse"
                   data-bs-target=".navbar-collapse.show"
                   href="#"
                   onClick={(e) => this.navigateoConfig(e)} href="#">
                  <i className="fa fa-cog btn-icon-right" aria-hidden="true"></i>
                </a>
              </li>
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
