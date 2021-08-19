import React, { Component } from 'react';

import i18next from 'i18next';

import apiManager from '../lib/APIManager';
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

	render() {
    var contentJsx, buttonJsx;
    if (this.state.hutchProfile) {
      contentJsx =
        <div>
          <div className="d-flex justify-content-center">
            <img src={this.state.hutchProfile.picture} className="card-img-top profile-image"/>
          </div>
          <div className="d-flex justify-content-center">
            <p>{this.state.hutchProfile.message}</p>
          </div>
        </div>
      buttonJsx = 
        <div className="d-flex justify-content-center">
          <button type="button" onClick={this.editProfile} className="btn btn-secondary">{i18next.t("profileEdit")}</button>
        </div>
    } else {
      buttonJsx = <button type="button" onClick={this.editProfile} className="btn btn-secondary">{i18next.t("profileCreate")}</button>
    }
    return (
      <div>
        <div className="alert alert-primary" role="alert">
          {i18next.t("profileValue", {name: (this.state.hutchProfile.name||this.state.profile.name)})}
          <div className="btn-group float-end" role="group">
            <button type="button" className="btn btn-secondary btn-sm" onClick={this.lockAllSafe} title={i18next.t("lockAllSafe")}>
              <i className="fa fa-lock" aria-hidden="true"></i>
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
