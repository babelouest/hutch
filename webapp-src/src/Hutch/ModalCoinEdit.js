import React, { Component } from 'react';

import i18next from 'i18next';

import apiManager from '../lib/APIManager';

class ModalCoinEdit extends Component {
  constructor(props) {
    super(props);

    this.state = {
      cb: props.cb,
      name: props.name,
      content: props.content,
      show: props.show,
      iconListOrig: {},
      iconList: {},
      iconFilter: "",
      displayNameError: false
    };

    this.changeDisplayName = this.changeDisplayName.bind(this);
    this.useIcon = this.useIcon.bind(this);

    if (this.state.show) {
      apiManager.request("fonts/forkawesome-ful-list.json")
      .then((iconList) => {
        this.setState({iconListOrig: iconList, iconList: iconList});
      })
      .catch(() => {
        this.setState({iconListOrig: [], iconList: []});
      });
    }
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

  changeDisplayName(e) {
    var content = this.state.content;
    content.displayName = e.target.value;
    this.setState({content: content, displayNameError: false});
  }

  changeIconFilter(e) {
    this.setState({iconFilter: e.target.value}, () => {
      if (this.state.iconFilter) {
        var iconList = {};
        Object.keys(this.state.iconListOrig).forEach(category => {
          iconList[category] = [];
          var categoryList = this.state.iconListOrig[category]||[];
          categoryList.forEach(icon => {
            if (icon.label.toUpperCase().search(this.state.iconFilter.toUpperCase()) > -1) {
              iconList[category].push(icon);
            }
          });
          if (!iconList[category].length) {
            delete(iconList[category]);
          }
        });
        this.setState({iconList: iconList});
      } else {
        this.setState({iconList: this.state.iconListOrig});
      }
    });
  }

  useIcon(e, icon) {
    e.preventDefault();
    var content = this.state.content;
    content.icon = icon.icon;
    this.setState({content: content});
  }

  verifyDisplayName(e) {
    e.preventDefault();
    if (!this.state.content.displayName) {
      this.setState({displayNameError: true});
    } else {
      this.closeModal(e, true);
    }
  }

  closeModal(e, result) {
    if (this.state.cb) {
      this.state.cb(result, this.state.name, this.state.content, true);
    }
  }

	render() {
    var iconListJsx = [], iconUsedJsx, displayNameClass = "form-control", displayNameErrorJsx;
    Object.keys(this.state.iconList).forEach(category => {
      var categoryList = this.state.iconList[category]||[];
      iconListJsx.push(<li className="list-group-item" key={category}><span className="badge bg-secondary">{category}</span></li>);
      var faBtnList = [];
      categoryList.forEach((icon, index) => {
        faBtnList.push(
          <a key={category+"-"+index} href="" onClick={e => this.useIcon(e, icon)} className="btn btn-primary btn-icon btn-icon-top">
            <span className="btn-icon">{icon.label}</span>
            <i className={"fa "+icon.icon} aria-hidden="true"></i>
          </a>);
      });
      iconListJsx.push(
        <li className="list-group-item" key={category+"-lst"}>
          {faBtnList}
        </li>);
    });
    if (this.state.content.icon) {
      iconUsedJsx = <i className={"btn-icon-right fa "+this.state.content.icon} aria-hidden="true"></i>;
    }
    if (this.state.displayNameError) {
      displayNameClass += " is-invalid";
      displayNameErrorJsx =
        <div className="invalid-feedback">
          {i18next.t("displayNameError")}
        </div>
    }
    return (
      <div className="modal" tabIndex="-1" id="modalCoinEdit">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{this.state.name?i18next.t("CoinEditTitle"):i18next.t("CoinAddTitle")}</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={(e) => this.closeModal(e, false)}></button>
            </div>
            <form onSubmit={(e) => this.verifyDisplayName(e)}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="coinDisplayName" className="form-label">{i18next.t("coinDisplayName")}</label>
                  <input type="text"
                         maxLength="128"
                         className={displayNameClass}
                         id="coinDisplayName"
                         value={this.state.content.displayName||""}
                         onChange={(e) => this.changeDisplayName(e)} />
                  {displayNameErrorJsx}
                </div>
                <hr/>
                <div className="mb-3">
                  <label className="form-label">{i18next.t("coinIconList")}{iconUsedJsx}</label>
                  <input type="text"
                         maxLength="128"
                         className="form-control"
                         id="coinIconFilter"
                         placeholder={i18next.t("coinIconFilterPh")}
                         value={this.state.iconFilter||""}
                         onChange={(e) => this.changeIconFilter(e)} />
                  <ul className="list-group icon-list">
                    {iconListJsx}
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={(e) => this.closeModal(e, false)}>{i18next.t("modalClose")}</button>
                <button type="submit" className="btn btn-primary" onClick={(e) => this.verifyDisplayName(e)}>{i18next.t("modalOk")}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
	}
}

export default ModalCoinEdit;
