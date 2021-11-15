import React, { Component } from 'react';

import i18next from 'i18next';

import messageDispatcher from '../lib/MessageDispatcher';

import ProfileEdit from './ProfileEdit';
import ProfileView from './ProfileView';

class Profile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      profile: props.profile,
      hutchProfile: props.hutchProfile,
      hasProfile: props.hasProfile,
      editProfile: props.editProfile,
      oidcStatus: props.oidcStatus
    };
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

	render() {
    if (this.state.oidcStatus === "connecting") {
      return (
        <div className="alert alert-success" role="alert">
          {i18next.t("connectingMessage")}
        </div>
      );
    } else if (this.state.oidcStatus === "disconnected") {
      return (
        <div className="alert alert-warning" role="alert">
          {i18next.t("disconnectedMessage")}
        </div>
      );
    } else {
      if (this.state.editProfile) {
        return (
          <ProfileEdit config={this.state.config} hutchProfile={this.state.hutchProfile} />
        );
      } else {
        return (
          <ProfileView config={this.state.config} hutchProfile={this.state.hutchProfile} profile={this.state.profile} />
        );
      }
    }
	}
}

export default Profile;
