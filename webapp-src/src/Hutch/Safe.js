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
      hutchProfile: props.hutchProfile,
      safe: props.safe,
      safeContent: props.safeContent,
      editMode: editMode
    };
  }
  
  static getDerivedStateFromProps(props, state) {
    var nextProps = Object.assign({}, props);
    if (!props.editMode && props.safeContent && props.safe && props.safeContent[props.safe.name] && !props.safeContent[props.safe.name].keyList.length) {
      nextProps.editMode = 2;
    }
    return nextProps;
  }
  
	render() {
    var hasKeys = (this.state.safe && this.state.safeContent && this.state.safeContent[this.state.safe.name] && this.state.safeContent[this.state.safe.name].keyList.length);
    if (!this.state.editMode && hasKeys) {
      return (
        <SafeView config={this.state.config}
                  safe={this.state.safe}
                  safeContent={this.state.safeContent}/>
      );
    } else {
      return (
        <SafeEdit config={this.state.config}
                  safe={this.state.safe}
                  safeContent={this.state.safeContent}
                  editMode={this.state.editMode}/>
      );
    }
	}
}

export default Safe;