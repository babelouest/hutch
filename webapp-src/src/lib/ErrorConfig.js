import React, { Component } from 'react';

class ErrorConfig extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      message: props.message
    };
  }
  
  render() {
    return (
      <div className="alert alert-danger perfect-centering" role="alert">
        <h4>Configuration error</h4>
        <span>
          {this.state.message}
        </span>
      </div>
    );
  }
}

export default ErrorConfig;
