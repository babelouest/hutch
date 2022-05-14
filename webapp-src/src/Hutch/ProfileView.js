import React, { Component } from 'react';

import i18next from 'i18next';

import messageDispatcher from '../lib/MessageDispatcher';

class ProfileView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      profile: props.profile,
      hutchProfile: props.hutchProfile
    };
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }
  
  editProfile() {
    messageDispatcher.sendMessage('App', {action: "editProfile"});
  }
  
  lockAllSafe() {
    messageDispatcher.sendMessage('App', {action: "lockAllSafe"});
    messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("lockedAllSafe")});
  }

  addSafe() {
    messageDispatcher.sendMessage("App", {action: 'addSafe'});
  }
  
	render() {
    var contentJsx, buttonJsx;
    if (this.state.hutchProfile) {
      let message = this.state.hutchProfile.message;
      if (!this.state.config.frontend.offline) {
        buttonJsx = 
          <div className="d-flex justify-content-center">
            <button type="button" onClick={this.editProfile} className="btn btn-secondary">{i18next.t("profileEdit")}</button>
          </div>
      } else {
        message = i18next.t("offlineProfileMessage");
      }
      contentJsx =
        <div>
          <div className="d-flex justify-content-center">
            <img src={this.state.hutchProfile.picture} className="card-img-top profile-image"/>
          </div>
          <div className="d-flex justify-content-center">
            <p>{message}</p>
          </div>
        </div>
    } else {
      buttonJsx = <button type="button" onClick={this.editProfile} className="btn btn-secondary">{i18next.t("profileCreate")}</button>
    }
    return (
      <div>
        <div className="alert alert-primary" role="alert">
          {i18next.t("profileValue", {name: (this.state.hutchProfile.name||this.state.profile.name||"")})}
          <div className="btn-group float-end" role="group">
            <button type="button" className="btn btn-secondary btn-sm" onClick={this.lockAllSafe} title={i18next.t("lockAllSafe")}>
              <i className="fa fa-lock" aria-hidden="true"></i>
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={this.addSafe} title={i18next.t("addSafe")}>
              <i className="fa fa-plus" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        {contentJsx}
        {buttonJsx}
      </div>
    );
	}
}

export default ProfileView;
