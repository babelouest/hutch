import React, { Component } from 'react';

import i18next from 'i18next';

import messageDispatcher from '../lib/MessageDispatcher';
import SafeEdit from './SafeEdit';
import SafeView from './SafeView';

class Safe extends Component {
  constructor(props) {
    super(props);

    var editMode = props.editMode;
    if (!props.editMode && props.safeContent && props.safe && props.safeContent[props.safe.name] && !props.safeContent[props.safe.name].keyList.length) {
      editMode = 2;
    }
    this.state = {
      config: props.config,
      profile: props.profile,
      oidcStatus: props.oidcStatus,
      hutchProfile: props.hutchProfile,
      safe: props.safe,
      safeContent: props.safeContent,
      iconList: props.iconList,
      loadingData: props.loadingData,
      editMode: editMode
    };
  }
  
  static getDerivedStateFromProps(props, state) {
    var nextProps = Object.assign({}, props);
    if (!props.editMode && props.safeContent && props.safe && props.safeContent[props.safe.name] && !props.safeContent[props.safe.name].keyList.length && !props.safe.offline) {
      nextProps.editMode = 2;
    }
    return nextProps;
  }
  
	render() {
    var hasKeys = this.state.safe && (this.state.safe.offline || (this.state.safeContent && this.state.safeContent[this.state.safe.name] && this.state.safeContent[this.state.safe.name].keyList.length));
    if (this.state.config.frontend.offline) {
      if (!this.state.editMode) {
        return (
          <SafeView config={this.state.config}
                    profile={this.state.profile}
                    safe={this.state.safe}
                    safeContent={this.state.safeContent}
                    oidcStatus={this.state.oidcStatus}
                    iconList={this.state.iconList} />
        );
      } else {
        return (
          <SafeEdit config={this.state.config}
                    profile={this.state.profile}
                    safe={this.state.safe}
                    safeContent={this.state.safeContent}
                    editMode={this.state.editMode}/>
        );
      }
    } else {
      if (this.state.loadingData) {
        return 
          <div className="perfect-centering">
            <img src="img/hutch.jpg" className="img-fluid" alt="hutch"/>
          </div>
      } else {
        if ((!this.state.editMode && hasKeys) || this.state.oidcStatus !== "connected") {
          return (
            <SafeView config={this.state.config}
                      profile={this.state.profile}
                      safe={this.state.safe}
                      safeContent={this.state.safeContent}
                      oidcStatus={this.state.oidcStatus}
                      iconList={this.state.iconList} />
          );
        } else {
          return (
            <SafeEdit config={this.state.config}
                      profile={this.state.profile}
                      safe={this.state.safe}
                      safeContent={this.state.safeContent}
                      editMode={this.state.editMode}/>
          );
        }
      }
    }
	}
}

export default Safe;
