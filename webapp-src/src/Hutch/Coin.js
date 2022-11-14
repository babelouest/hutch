import React, { Component } from 'react';

import i18next from 'i18next';

import CoinEditElementUrl from './CoinEditElementUrl';
import CoinEditElementUsername from './CoinEditElementUsername';
import CoinEditElementPassword from './CoinEditElementPassword';
import CoinEditElementFile from './CoinEditElementFile';
import CoinEditElementMisc from './CoinEditElementMisc';

import CoinElementUrl from './CoinElementUrl';
import CoinElementUsername from './CoinElementUsername';
import CoinElementPassword from './CoinElementPassword';
import CoinElementSecretQuestions from './CoinElementSecretQuestions';
import CoinElementFile from './CoinElementFile';
import CoinElementMisc from './CoinElementMisc';

import ModalCoinElementTags from './ModalCoinElementTags';
import ModalCoinExport from './ModalCoinExport';

import Confirm from './Confirm';

import messageDispatcher from '../lib/MessageDispatcher';

class Coin extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      oidcStatus: props.oidcStatus,
      safe: props.safe,
      coin: props.coin,
      cbEditHeader: props.cbEditHeader,
      cbRemoveCoin: props.cbRemoveCoin,
      cbSaveCoin: props.cbSaveCoin,
      allTags: props.allTags,
      showAddElement: false,
      newElementType: false,
      editElementList: [],
      curElementIndex: -1,
      showConfirm: false,
      showEditTags: false,
      showExportCoin: false,
      sortRowsEnabled: false,
      overId: false,
      editCoinTags: true
    };

    this.exportCoin = this.exportCoin.bind(this);
    this.exportCoinClose = this.exportCoinClose.bind(this);
    this.addSecretElement = this.addSecretElement.bind(this);
    this.cancelEditElement = this.cancelEditElement.bind(this);
    this.editElement = this.editElement.bind(this);
    this.removeElement = this.removeElement.bind(this);
    this.removeElementConfirm = this.removeElementConfirm.bind(this);
    this.setElementTags = this.setElementTags.bind(this);
    this.setElementTagsConfirm = this.setElementTagsConfirm.bind(this);
    this.saveElement = this.saveElement.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.setCoinTags = this.setCoinTags.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

  exportCoin() {
    this.setState({showExportCoin: true}, () => {
      var exportCoinModal = new bootstrap.Modal(document.getElementById('exportCoinModal'), {
        keyboard: false
      });
      exportCoinModal._element.addEventListener('hidden.bs.modal', (event) => {
        this.exportCoinClose();
      });
      exportCoinModal.show();
    });
  }

  exportCoinClose() {
    var exportCoinModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#exportCoinModal'));
    exportCoinModal.hide();
    this.setState({showExportCoin: false});
  }

  addSecretElement() {
    var type = "url";
    var hasUrl = false, hasLogin = false;
    this.state.coin.data.rows.forEach((row, index) => {
      if (row.type === "url") {
        hasUrl = true;
      } else if (row.type === "login") {
        hasLogin = true;
      }
    });
    if (hasUrl && hasLogin) {
      type = "password";
    } else if (hasUrl) {
      type = "login";
    } else {
      type = "url";
    }
    this.setState({showAddElement: true, newElementType: type});
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
      this.state.cbSaveCoin(true, coin.name, coin.data, true);
    }
    var removeModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#removeElement'));
    removeModal.hide();
    this.setState({showConfirm: false});
  }

  setElementTags(e, index) {
    e.preventDefault();
    this.setState({curElementIndex: index, curTags: this.state.coin.data.rows[index].tags||[], showEditTags: true, editCoinTags: false}, () => {
      var modalCoinElementTags = new bootstrap.Modal(document.getElementById('modalCoinElementTags'), {
        keyboard: false
      });
      modalCoinElementTags.show();
    });
  }

  setCoinTags() {
    this.setState({curTags: this.state.coin.data.tags||[], showEditTags: true, editCoinTags: true}, () => {
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
        if (this.state.editCoinTags) {
          coin.data.tags = tags;
        } else {
          coin.data.rows[this.state.curElementIndex].tags = tags;
        }
      } else {
        if (this.state.editCoinTags) {
          delete(coin.data.tags);
        } else {
          delete(coin.data.rows[this.state.curElementIndex].tags);
        }
      }
      this.state.cbSaveCoin(true, coin.name, coin.data, true);
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
      this.state.cbSaveCoin(true, coin.name, coin.data, true);
    });
  }

  cancelEditElement(e, index) {
    e && e.preventDefault();
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

  copyToClipboard(value) {
    navigator.clipboard.writeText(value).then(() => {
      messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageCopyToClipboard")});
    });
  }

  sortRows() {
    this.setState({sortRowsEnabled: !this.state.sortRowsEnabled}, () => {
      if (this.state.sortRowsEnabled) {
        messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageSortEnabled")});
      } else {
        messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageSortDisabled")});
      }
    });
  }

  switchRows(indexSource, indexOver) {
    var coin = this.state.coin;
    var row = coin.data.rows[indexSource];
    coin.data.rows.splice(indexSource, 1);
    coin.data.rows.splice(indexOver, 0, row);
    this.state.cbSaveCoin(true, coin.name, coin.data, true);
  }

  onDragStart(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
  }

  onDrop(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text").split("-");
    if (data && data.length === 2 && data[0] === this.state.coin.name) {
      this.switchRows(parseInt(data[1]), parseInt(this.state.overId));
    }
  }

  onDragOver(ev) {
    var elt = ev.target;
    while (elt) {
      if (elt.draggable) {
        var data = elt.id.split("-");
        if (data && data.length === 2 && data[0] === this.state.coin.name) {
          this.setState({overId: data[1]});
        }
        break;
      }
      elt = elt.parentElement;
    }
    ev.preventDefault();
  }
  
  toggleAccordion(e) {
    e.preventDefault();
    $("#collapse-"+this.state.coin.name).collapse('toggle');
  }
  
	render() {
    var coinIconJsx, addElementJsx, newElementJsx, newElementSeparator, elementListJsx = [], confirmJsx, editTagsJsx, exportCoinJsx, headerButtonsJsx, headerButtonList = [], headerButtonListJsx = [], tagsListJsx = [];
    if (this.state.coin.data.icon) {
      coinIconJsx = <i className={this.state.coin.data.icon + " fa btn-icon"} aria-hidden="true"></i>;
    }
    if (this.state.coin.data.tags) {
      this.state.coin.data.tags.forEach((tag, index) => {
        tagsListJsx.push(
          <span className="badge rounded-pill bg-secondary btn-icon" key={index}>
            {tag}
          </span>
        );
      });
    }
    if (this.state.showAddElement) {
      addElementJsx =
        <div className="input-group mb-3">
          <span className="input-group-text" id="basic-addon1">{i18next.t("coinElementType")}</span>
          <select className="form-select" id="addElement" onChange={(e) => this.setNewElementType(e)} value={this.state.newElementType}>
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
                                            element={{type: this.state.newElementType, value: ""}}
                                            index={-1}
                                            cbSave={this.saveElement}
                                            cbCancel={this.cancelEditElement} />
        newElementSeparator = <hr/>
        break;
      case "login":
        newElementJsx = <CoinEditElementUsername coin={this.state.coin}
                                                 element={{type: this.state.newElementType, value: ""}}
                                                 index={-1}
                                                 cbSave={this.saveElement}
                                                 cbCancel={this.cancelEditElement} />
        newElementSeparator = <hr/>
        break;
      case "password":
        newElementJsx = <CoinEditElementPassword config={this.state.config}
                                                 coin={this.state.coin}
                                                 element={{type: this.state.newElementType, value: ""}}
                                                 index={-1}
                                                 cbSave={this.saveElement}
                                                 cbCancel={this.cancelEditElement} />
        newElementSeparator = <hr/>
        break;
      case "secretQuestion":
        newElementJsx = <CoinElementSecretQuestions config={this.state.config}
                                                    coin={this.state.coin}
                                                    element={{type: this.state.newElementType, value: []}}
                                                    index={-1}
                                                    closeButon={true}
                                                    cbSave={this.saveElement}
                                                    cbRemove={this.removeElement}
                                                    cbCancel={this.cancelEditElement}
                                                    cbTags={(e) => this.setElementTags(e, index)} />
        newElementSeparator = <hr/>
        break;
      case "file":
        newElementJsx = <CoinEditElementFile coin={this.state.coin}
                                             element={{type: this.state.newElementType, value: {}}}
                                             index={-1}
                                             cbSave={this.saveElement}
                                             cbCancel={this.cancelEditElement} />
        newElementSeparator = <hr/>
        break;
      case "misc":
        newElementJsx = <CoinEditElementMisc coin={this.state.coin}
                                             element={{type: this.state.newElementType, value: ""}}
                                             index={-1}
                                             cbSave={this.saveElement}
                                             cbCancel={this.cancelEditElement} />
        newElementSeparator = <hr/>
        break;
      default:
    }
    if (this.state.showConfirm) {
      confirmJsx = <Confirm name={"removeElement"} title={i18next.t("removeElementTitle")} message={i18next.t("removeElementMessage")} cb={this.removeElementConfirm} />
    }
    if (this.state.showEditTags) {
      editTagsJsx = <ModalCoinElementTags tags={this.state.curTags} allTags={this.state.allTags} cb={this.setElementTagsConfirm} />
    }
    if (this.state.showExportCoin) {
      exportCoinJsx = <ModalCoinExport config={this.state.config} cb={this.exportCoinClose} safe={this.state.safe} coin={this.state.coin} />
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
                                                cbTags={(e) => this.setElementTags(e, index)}
                                                isDraggable={this.state.sortRowsEnabled}
                                                cbOnDragStart={this.onDragStart}
                                                cbOnDragOver={this.onDragOver}
                                                oidcStatus={this.state.oidcStatus}/>);
          } else {
            elementListJsx.push(<CoinEditElementUrl key={index}
                                                    coin={this.state.coin}
                                                    element={row}
                                                    index={index}
                                                    cbSave={this.saveElement}
                                                    cbCancel={this.cancelEditElement}
                                                    isDraggable={this.state.sortRowsEnabled}
                                                    cbOnDragStart={this.onDragStart}
                                                    cbOnDragOver={this.onDragOver}/>);
          }
          break;
        case "login":
          if (!row.hideMenu) {
            headerButtonList.push({type: "login", value: row.value, tags: (row.tags||[i18next.t("coinElementLogin")]).join(" ")});
          }
          if (this.state.editElementList.indexOf(index) === -1) {
            elementListJsx.push(<CoinElementUsername key={index}
                                                     coin={this.state.coin}
                                                     element={row}
                                                     index={index}
                                                     cbEdit={this.editElement}
                                                     cbRemove={this.removeElement}
                                                     cbTags={(e) => this.setElementTags(e, index)}
                                                     isDraggable={this.state.sortRowsEnabled}
                                                     cbOnDragStart={this.onDragStart}
                                                     cbOnDragOver={this.onDragOver}
                                                     oidcStatus={this.state.oidcStatus}/>);
          } else {
            elementListJsx.push(<CoinEditElementUsername key={index}
                                                         coin={this.state.coin}
                                                         element={row}
                                                         index={index}
                                                         cbSave={this.saveElement}
                                                         cbCancel={this.cancelEditElement}
                                                         isDraggable={this.state.sortRowsEnabled}
                                                         cbOnDragStart={this.onDragStart}
                                                         cbOnDragOver={this.onDragOver}/>);
          }
          break;
        case "password":
          if (!row.hideMenu) {
            headerButtonList.push({type: "password", value: row.value, tags: (row.tags||[i18next.t("coinElementPassword")]).join(" ")});
          }
          if (this.state.editElementList.indexOf(index) === -1) {
            elementListJsx.push(<CoinElementPassword key={index}
                                                     coin={this.state.coin}
                                                     element={row}
                                                     index={index}
                                                     cbEdit={this.editElement}
                                                     cbRemove={this.removeElement}
                                                     cbTags={(e) => this.setElementTags(e, index)}
                                                     isDraggable={this.state.sortRowsEnabled}
                                                     cbOnDragStart={this.onDragStart}
                                                     cbOnDragOver={this.onDragOver}
                                                     oidcStatus={this.state.oidcStatus}/>);
          } else {
            elementListJsx.push(<CoinEditElementPassword key={index}
                                                         config={this.state.config}
                                                         coin={this.state.coin}
                                                         element={row}
                                                         index={index}
                                                         cbSave={this.saveElement}
                                                         cbCancel={this.cancelEditElement}
                                                         isDraggable={this.state.sortRowsEnabled}
                                                         cbOnDragStart={this.onDragStart}
                                                         cbOnDragOver={this.onDragOver}/>);
          }
          break;
        case "secretQuestion":
          elementListJsx.push(<CoinElementSecretQuestions key={index}
                                                          config={this.state.config}
                                                          coin={this.state.coin}
                                                          element={row}
                                                          index={index}
                                                          closeButon={false}
                                                          cbSave={this.saveElement}
                                                          cbRemove={this.removeElement}
                                                          cbCancel={this.cancelEditElement}
                                                          cbTags={(e) => this.setElementTags(e, index)}
                                                          isDraggable={this.state.sortRowsEnabled}
                                                          cbOnDragStart={this.onDragStart}
                                                          cbOnDragOver={this.onDragOver}
                                                          oidcStatus={this.state.oidcStatus}/>);
          break;
        case "file":
          if (this.state.editElementList.indexOf(index) === -1) {
            elementListJsx.push(<CoinElementFile key={index}
                                                 coin={this.state.coin}
                                                 element={row}
                                                 index={index}
                                                 cbEdit={this.editElement}
                                                 cbRemove={this.removeElement}
                                                 cbTags={(e) => this.setElementTags(e, index)}
                                                 isDraggable={this.state.sortRowsEnabled}
                                                 cbOnDragStart={this.onDragStart}
                                                 cbOnDragOver={this.onDragOver}
                                                 oidcStatus={this.state.oidcStatus}/>);
          } else {
            elementListJsx.push(<CoinEditElementFile key={index}
                                                     coin={this.state.coin}
                                                     element={row}
                                                     index={index}
                                                     cbSave={this.saveElement}
                                                     cbCancel={this.cancelEditElement}
                                                     isDraggable={this.state.sortRowsEnabled}
                                                     cbOnDragStart={this.onDragStart}
                                                     cbOnDragOver={this.onDragOver}/>);
          }
          break;
        case "misc":
          if (this.state.editElementList.indexOf(index) === -1) {
            elementListJsx.push(<CoinElementMisc key={index}
                                                 coin={this.state.coin}
                                                 element={row}
                                                 index={index}
                                                 cbEdit={this.editElement}
                                                 cbRemove={this.removeElement}
                                                 cbTags={(e) => this.setElementTags(e, index)}
                                                 isDraggable={this.state.sortRowsEnabled}
                                                 cbOnDragStart={this.onDragStart}
                                                 cbOnDragOver={this.onDragOver}
                                                 oidcStatus={this.state.oidcStatus}/>);
          } else {
            elementListJsx.push(<CoinEditElementMisc key={index}
                                                     coin={this.state.coin}
                                                     element={row}
                                                     index={index}
                                                     cbSave={this.saveElement}
                                                     cbCancel={this.cancelEditElement}
                                                     isDraggable={this.state.sortRowsEnabled}
                                                     cbOnDragStart={this.onDragStart}
                                                     cbOnDragOver={this.onDragOver}/>);
          }
          break;
        default:
      }
    });
    if (headerButtonList.length <= 2) {
      headerButtonList.forEach((button, index) => {
        if (button.type === "login") {
          headerButtonListJsx.push(
            <button key={index} type="button" className="btn btn-secondary" onClick={(e) => this.copyToClipboard(button.value)} title={button.tags}>
              <i className="fa fa-user" aria-hidden="true"></i>
            </button>
          );
        } else {
          headerButtonListJsx.push(
            <button key={index} type="button" className="btn btn-secondary" onClick={(e) => this.copyToClipboard(button.value)} title={button.tags}>
              <i className="fa fa-key" aria-hidden="true"></i>
            </button>
          );
        }
      });
    } else {
      headerButtonListJsx.push(
        <button key={0} type="button" className="btn btn-secondary" onClick={(e) => this.toggleAccordion(e)}>
          <i className="fa fa-user btn-icon" aria-hidden="true"></i>
          <i className="fa fa-key btn-icon" aria-hidden="true"></i>
          <i className="fa fa-chevron-down" aria-hidden="true"></i>
        </button>
      );
    }
    headerButtonsJsx =
      <div className="input-group">
        {headerButtonListJsx}
      </div>
    var sortBtnClass = "btn btn-sm";
    if (this.state.sortRowsEnabled) {
      sortBtnClass += " btn-primary";
    } else {
      sortBtnClass += " btn-secondary";
    }
    return (
      <div className="col">
        <div className="accordion" id={"coin-"+this.state.coin.name}>
          <div className="accordion-item">
            <h2 className="accordion-header" id={"heading-"+this.state.coin.name}>
              <div className="btn-toolbar justify-content-between" role="toolbar" aria-label="Toolbar with button groups">
                <div className="btn-group text-truncate" role="group" aria-label="First group">
                  <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={"#collapse-"+this.state.coin.name} aria-expanded="false" aria-controls={"collapse-"+this.state.coin.name}>
                    {coinIconJsx}{this.state.coin.data.displayName}
                  </button>
                </div>
                {headerButtonsJsx}
              </div>
            </h2>
            <div id={"collapse-"+this.state.coin.name} className="accordion-collapse collapse" aria-labelledby={"heading-"+this.state.coin.name} data-bs-parent={"#coin-"+this.state.coin.name}>
              <div className="accordion-body">
                <div className="mb-3" role="group">
                  {tagsListJsx}
                  <div className="btn-group float-end" role="group">
                    <button type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => this.state.cbEditHeader(this.state.coin.name, this.state.coin.data)}
                            disabled={this.state.oidcStatus !== "connected"}
                            title={i18next.t("editCoinHeader")}>
                      <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
                    </button>
                    <button type="button"
                            className={sortBtnClass}
                            onClick={(e) => this.sortRows()}
                            disabled={this.state.oidcStatus !== "connected"}
                            title={i18next.t("sortCoin")}>
                      <i className="fa fa-sort" aria-hidden="true"></i>
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
                            disabled={this.state.oidcStatus !== "connected"}
                            title={i18next.t("addSecretElement")}>
                      <i className="fa fa-plus" aria-hidden="true"></i>
                    </button>
                    <button type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={this.setCoinTags}
                            disabled={this.state.oidcStatus !== "connected"}
                            title={i18next.t("setCoinTags")}>
                      <i className="fa fa-tags" aria-hidden="true"></i>
                    </button>
                    <button type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => this.state.cbRemoveCoin(this.state.coin.name, this.state.coin.data.displayName)}
                            disabled={this.state.oidcStatus !== "connected"}
                            title={i18next.t("removeCoin")}>
                      <i className="fa fa-trash-o" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
                &nbsp;
                {addElementJsx}
                {newElementJsx}
                {newElementSeparator}
                <div onDrop={this.onDrop} onDragOver={this.onDragOver}>
                  {elementListJsx}
                </div>
              </div>
            </div>
          </div>
          {confirmJsx}
          {editTagsJsx}
          {exportCoinJsx}
        </div>
      </div>
    );
	}
}

export default Coin;
