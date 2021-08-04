import React, { Component } from 'react';

import i18next from 'i18next';

import CoinEditElementUrl from './CoinEditElementUrl';
import CoinEditElementUsername from './CoinEditElementUsername';
import CoinEditElementPassword from './CoinEditElementPassword';

import CoinElementUrl from './CoinElementUrl';
import CoinElementUsername from './CoinElementUsername';
import CoinElementPassword from './CoinElementPassword';

import ModalCoinElementTags from './ModalCoinElementTags';

import Confirm from './Confirm';

class Coin extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      coin: props.coin,
      cbEditHeader: props.cbEditHeader,
      cbRemoveCoin: props.cbRemoveCoin,
      cbSaveCoin: props.cbSaveCoin,
      showAddElement: false,
      newElementType: false,
      editElementList: [],
      curElementIndex: -1,
      showConfirm: false,
      showEditTags: false
    };

    this.exportCoin = this.exportCoin.bind(this);
    this.addSecretElement = this.addSecretElement.bind(this);
    this.cancelEditElement = this.cancelEditElement.bind(this);
    this.editElement = this.editElement.bind(this);
    this.removeElement = this.removeElement.bind(this);
    this.removeElementConfirm = this.removeElementConfirm.bind(this);
    this.setElementTags = this.setElementTags.bind(this);
    this.setElementTagsConfirm = this.setElementTagsConfirm.bind(this);
    this.saveElement = this.saveElement.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

  exportCoin() {
  }

  addSecretElement() {
    this.setState({showAddElement: true, newElementType: "url"});
  }
  
  setNewElementType(e) {
    this.setState({newElementType: e.target.value});
  }
  
  editElement(e, index) {
    e.preventDefault();
    var editElementList = this.state.editElementList;
    editElementList.push(index);
    this.setState({editElementList: editElementList});
  }
  
  removeElement(e, index) {
    e.preventDefault();
    this.setState({curElementIndex: index, showConfirm: true}, () => {
      var removeModal = new bootstrap.Modal(document.getElementById('removeElement'), {
        keyboard: false
      });
      removeModal.show();
    });
  }
  
  removeElementConfirm(result) {
    if (result) {
      var coin = this.state.coin;
      coin.data.rows.splice(this.state.curElementIndex, 1);
      this.state.cbSaveCoin(true, coin.name, coin.data);
    }
    var removeModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#removeElement'));
    removeModal.hide();
    this.setState({showConfirm: false});
  }
  
  setElementTags(e, index) {
    e.preventDefault();
    this.setState({curElementIndex: index, curTags: this.state.coin.data.rows[index].tags||[], showEditTags: true}, () => {
      var modalCoinElementTags = new bootstrap.Modal(document.getElementById('modalCoinElementTags'), {
        keyboard: false
      });
      modalCoinElementTags.show();
    });
  }
  
  setElementTagsConfirm(result, tags) {
    if (result) {
      var coin = this.state.coin;
      if (tags.length) {
        coin.data.rows[this.state.curElementIndex].tags = tags;
      } else {
        delete(coin.data.rows[this.state.curElementIndex].tags);
      }
      this.state.cbSaveCoin(true, coin.name, coin.data);
    }
    var modalCoinElementTags = bootstrap.Modal.getOrCreateInstance(document.querySelector('#modalCoinElementTags'));
    modalCoinElementTags.hide();
    this.setState({showEditTags: false});
  }
  
  saveElement(e, element, index) {
    var coin = this.state.coin;
    if (index === -1) {
      coin.data.rows.push(element);
    } else {
      coin.data.rows[index] = element;
      this.cancelEditElement(e, index);
    }
    this.setState({showAddElement: false, newElementType: false}, () => {
      this.state.cbSaveCoin(true, coin.name, coin.data);
    });
  }
  
  cancelEditElement(e, index) {
    e.preventDefault();
    if (index === -1) {
      this.setState({showAddElement: false, newElementType: false});
    } else {
      var editElementList = this.state.editElementList;
      if (editElementList.indexOf(index) > -1) {
        editElementList.splice(editElementList.indexOf(index), 1);
      }
      this.setState({editElementList: editElementList});
    }
  }

	render() {
    var coinIconJsx, addElementJsx, newElementJsx, elementListJsx = [], confirmJsx, editTagsJsx;
    if (this.state.coin.data.icon) {
      coinIconJsx = <i className={this.state.coin.data.icon + " btn-icon"} aria-hidden="true"></i>;
    }
    if (this.state.showAddElement) {
      addElementJsx =
        <div className="input-group mb-3">
          <span className="input-group-text" id="basic-addon1">{i18next.t("coinElementType")}</span>
          <select className="form-select" id="addElement" onChange={(e) => this.setNewElementType(e)}>
            <option value="url">{i18next.t("coinElementTypeUrl")}</option>
            <option value="login">{i18next.t("coinElementTypeLogin")}</option>
            <option value="password">{i18next.t("coinElementTypePassword")}</option>
            <option value="secretQuestion">{i18next.t("coinElementTypeSecretQuestion")}</option>
            <option value="file">{i18next.t("coinElementTypeFile")}</option>
            <option value="misc">{i18next.t("coinElementTypeMisc")}</option>
          </select>
        </div>
    }
    switch (this.state.newElementType) {
      case "url":
        newElementJsx = <CoinEditElementUrl coin={this.state.coin}
                                            element={{type: "url", value: ""}}
                                            index={-1}
                                            cbSave={this.saveElement}
                                            cbCancel={this.cancelEditElement} />
        break;
      case "login":
        newElementJsx = <CoinEditElementUsername coin={this.state.coin}
                                                 element={{type: "login", value: ""}}
                                                 index={-1}
                                                 cbSave={this.saveElement}
                                                 cbCancel={this.cancelEditElement} />
        break;
      case "password":
        newElementJsx = <CoinEditElementPassword coin={this.state.coin}
                                                 element={{type: "password", value: ""}}
                                                 index={-1}
                                                 cbSave={this.saveElement}
                                                 cbCancel={this.cancelEditElement} />
        break;
      default:
    }
    if (this.state.showConfirm) {
      confirmJsx = <Confirm name={"removeElement"} title={i18next.t("removeElementTitle")} message={i18next.t("removeElementMessage")} cb={this.removeElementConfirm} />
    }
    if (this.state.showEditTags) {
      editTagsJsx = <ModalCoinElementTags index={this.state.curElementIndex} tags={this.state.curTags} cb={this.setElementTagsConfirm} />
    }
    this.state.coin.data.rows.forEach((row, index) => {
      switch (row.type) {
        case "url":
          if (this.state.editElementList.indexOf(index) === -1) {
            elementListJsx.push(<CoinElementUrl key={index}
                                                coin={this.state.coin}
                                                element={row}
                                                index={index}
                                                cbEdit={this.editElement}
                                                cbRemove={this.removeElement}
                                                cbTags={(e) => this.setElementTags(e, index)} />);
            } else {
            elementListJsx.push(<CoinEditElementUrl key={index}
                                                    coin={this.state.coin}
                                                    element={row}
                                                    index={index}
                                                    cbSave={this.saveElement}
                                                    cbCancel={this.cancelEditElement} />);
            }
          break;
        case "login":
          if (this.state.editElementList.indexOf(index) === -1) {
            elementListJsx.push(<CoinElementUsername key={index}
                                                     coin={this.state.coin}
                                                     element={row}
                                                     index={index}
                                                     cbEdit={this.editElement}
                                                     cbRemove={this.removeElement}
                                                     cbTags={(e) => this.setElementTags(e, index)} />);
            } else {
            elementListJsx.push(<CoinEditElementUsername key={index}
                                                         coin={this.state.coin}
                                                         element={row}
                                                         index={index}
                                                         cbSave={this.saveElement}
                                                         cbCancel={this.cancelEditElement} />);
            }
          break;
        case "password":
          if (this.state.editElementList.indexOf(index) === -1) {
            elementListJsx.push(<CoinElementPassword key={index}
                                                     coin={this.state.coin}
                                                     element={row}
                                                     index={index}
                                                     cbEdit={this.editElement}
                                                     cbRemove={this.removeElement}
                                                     cbTags={(e) => this.setElementTags(e, index)} />);
            } else {
            elementListJsx.push(<CoinEditElementPassword key={index}
                                                         coin={this.state.coin}
                                                         element={row}
                                                         index={index}
                                                         cbSave={this.saveElement}
                                                         cbCancel={this.cancelEditElement} />);
            }
          break;
        default:
      }
    });
    return (
      <div className="accordion" id={"coin-"+this.state.coin.name}>
        <div className="accordion-item">
          <h2 className="accordion-header" id={"heading-"+this.state.coin.name}>
            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={"#collapse-"+this.state.coin.name} aria-expanded="false" aria-controls={"collapse-"+this.state.coin.name}>
              {coinIconJsx}{this.state.coin.data.displayName}
            </button>
          </h2>
          <div id={"collapse-"+this.state.coin.name} className="accordion-collapse collapse" aria-labelledby={"heading-"+this.state.coin.name} data-bs-parent={"#coin-"+this.state.coin.name}>
            <div className="accordion-body">
              <div className="mb-3" role="group">
                <div className="btn-group float-end" role="group">
                  <button type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => this.state.cbEditHeader(this.state.coin.name, this.state.coin.data)}
                          title={i18next.t("editCoinHeader")}>
                    <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
                  </button>
                  <button type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={this.exportCoin}
                          title={i18next.t("exportCoin")}>
                    <i className="fa fa-cloud-download" aria-hidden="true"></i>
                  </button>
                  <button type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={this.addSecretElement}
                          title={i18next.t("addSecretElement")}>
                    <i className="fa fa-plus" aria-hidden="true"></i>
                  </button>
                  <button type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => this.state.cbRemoveCoin(this.state.coin.name, this.state.coin.data.displayName)}
                          title={i18next.t("removeCoin")}>
                    <i className="fa fa-trash-o" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
              &nbsp;
              {addElementJsx}
              {newElementJsx}
              {elementListJsx}
            </div>
          </div>
        </div>
        {confirmJsx}
        {editTagsJsx}
      </div>
    );
	}
}

export default Coin;
