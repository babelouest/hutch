import React, { Component } from 'react';

import i18next from 'i18next';

import { EncryptJWT } from 'jose-browser-runtime/jwt/encrypt';

import apiManager from '../lib/APIManager';
import messageDispatcher from '../lib/MessageDispatcher';

import ModalSafeUnlock from './ModalSafeUnlock';
import ModalCoinEdit from './ModalCoinEdit';
import ModalManageSafe from './ModalManageSafe';
import Coin from './Coin';
import Confirm from './Confirm';

class SafeView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      safe: props.safe,
      safeContent: props.safeContent,
      filteredCoinList: props.safeContent[props.safe.name].unlockedCoinList,
      filter: "",
      coinEditMode: 0,
      coinEditName: false,
      coinEditContent: false,
      removeCoinMessage: false,
      filterTimeout: false,
      filtering: false
    };
    
    this.editSafe = this.editSafe.bind(this);
    this.unlockSafe = this.unlockSafe.bind(this);
    this.unlockSafeCallback = this.unlockSafeCallback.bind(this);
    this.removeSafe = this.removeSafe.bind(this);
    this.removeSafeConfirm = this.removeSafeConfirm.bind(this);
    this.lockSafe = this.lockSafe.bind(this);
    this.changeFilter = this.changeFilter.bind(this);
    this.addCoin = this.addCoin.bind(this);
    this.editCoinHeader = this.editCoinHeader.bind(this);
    this.manageSafe = this.manageSafe.bind(this);
    this.removeCoin = this.removeCoin.bind(this);
    this.removeCoinConfirm = this.removeCoinConfirm.bind(this);
    this.coinSaveCallback = this.coinSaveCallback.bind(this);
  }
  
  static getDerivedStateFromProps(props, state) {
    var newState = Object.assign({}, props);
    if (props.safe.name !== state.safe.name) {
      newState.safeContent = props.safeContent;
      newState.filteredCoinList = props.safeContent[props.safe.name].unlockedCoinList;
      newState.filter = "";
    }
    return newState;
  }
  
  editSafe() {
    messageDispatcher.sendMessage('App', {action: "editSafe", target: this.state.safe.name});
  }
  
  unlockSafe() {
    var unlockSafeModal = new bootstrap.Modal(document.getElementById('modalUnlockSafe'), {
      keyboard: false
    });
    unlockSafeModal.show();
  }
  
  unlockSafeCallback(result, masterKey, keepUnlocked, unlockKeyName, masterkeyData) {
    if (result) {
      messageDispatcher.sendMessage('App', {action: "setSafeKey",
                                            target: this.state.safe,
                                            key: masterKey,
                                            keepUnlocked: keepUnlocked,
                                            unlockKeyName: unlockKeyName,
                                            removeStorage: false,
                                            masterkeyData: masterkeyData});
      messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("unlockedSafe")});
    }
    var unlockSafeModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#modalUnlockSafe'));
    unlockSafeModal.hide();
  }
  
  lockSafe() {
    messageDispatcher.sendMessage('App', {action: "setSafeKey", target: this.state.safe, key: false, removeStorage: true});
    messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("lockedSafe")});
  }
  
  removeSafe() {
    var removeModal = new bootstrap.Modal(document.getElementById('removeSafe'), {
      keyboard: false
    });
    removeModal.show();
  }
  
  removeSafeConfirm(result) {
    if (result) {
      apiManager.request(this.state.config.safe_endpoint + "/" + this.state.safe.name, "DELETE")
      .then(() => {
        messageDispatcher.sendMessage('App', {action: "removeSafe", safe: this.state.safe});
        messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageRemoveSafe")});
      })
      .fail(() => {
        messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageErrorSaveSafe")});
      });
    }
    var removeModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#removeSafe'));
    removeModal.hide();
  }

  changeFilter(e) {
    if (e.target.value) {
      this.setState({filter: e.target.value, filtering: true}, () => {
        clearTimeout(this.state.filterTimeout);
        var filterTimeout = setTimeout(() => {
          var filteredCoinList = [];
          this.state.safeContent[this.state.safe.name].unlockedCoinList.forEach((coin) => {
            if (coin.data.displayName.toUpperCase().search(this.state.filter.toUpperCase()) > -1) {
              filteredCoinList.push(coin);
            }
          });
          this.setState({filteredCoinList: filteredCoinList, filterTimeout: false, filtering: false});
        }, 3000);
      });
    } else {
      clearTimeout(this.state.filterTimeout);
      this.setState({filter: e.target.value, filtering: false, filteredCoinList: this.state.safeContent[this.state.safe.name].unlockedCoinList, filterTimeout: false, filtering: false});
    }
  }
  
  addCoin() {
    this.setState({name: false, coinEditContent: {displayName: "", rows: []}}, () => {
      var addCoinModal = new bootstrap.Modal(document.getElementById('modalCoinEdit'), {
        keyboard: false
      });
      addCoinModal.show();
    });
  }
  
  editCoinHeader(name, content) {
    this.setState({coinEditName: name, coinEditContent: content}, () => {
      var addCoinModal = new bootstrap.Modal(document.getElementById('modalCoinEdit'), {
        keyboard: false
      });
      addCoinModal.show();
    });
  }
  
  removeCoin(name, displayName) {
    this.setState({coinEditName: name, removeCoinMessage: i18next.t("removeCoinMessage", {name: displayName||name})}, () => {
      var removeModal = new bootstrap.Modal(document.getElementById('removeCoin'), {
        keyboard: false
      });
      removeModal.show();
    });
  }
  
  removeCoinConfirm(result) {
    if (result) {
      apiManager.request(this.state.config.safe_endpoint + "/" + this.state.safe.name + "/coin/" + this.state.coinEditName, "DELETE")
      .then(() => {
        messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageSuccessCoinRemove")});
        messageDispatcher.sendMessage('App', {action: "removeCoin", target: this.state.safe, coin: this.state.coinEditName});
      })
      .fail(() => {
        messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageErrorCoinRemove")});
      })
    }
    var modalCoinEditModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#removeCoin'));
    modalCoinEditModal.hide();
  }
  
  coinSaveCallback(result, name, content, toast = false) {
    var modalCoinEditModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#modalCoinEdit'));
    modalCoinEditModal && modalCoinEditModal.hide();
    if (result) {
      if (name) {
        return new EncryptJWT(content)
        .setProtectedHeader({ alg: this.state.safe.alg_type, enc: this.state.safe.enc_type, sign_thumb: this.state.config.sign_thumb })
        .encrypt(this.state.safeContent[this.state.safe.name].key)
        .then((data) => {
          var body = {
            name: name,
            data: data
          }
          return apiManager.request(this.state.config.safe_endpoint + "/" + this.state.safe.name + "/coin/" + name, "PUT", body)
          .then(() => {
            toast && messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageSuccessCoinSave")});
            messageDispatcher.sendMessage('App', {action: "updateCoin", target: this.state.safe, encCoin: body, unlockedCoin: {name: name, data: content}});
          })
          .fail(() => {
            toast && messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageErrorCoinSave")});
          })
        });
      } else {
        return new EncryptJWT(content)
        .setProtectedHeader({ alg: this.state.safe.alg_type, enc: this.state.safe.enc_type, sign_thumb: this.state.config.sign_thumb })
        .encrypt(this.state.safeContent[this.state.safe.name].key)
        .then((data) => {
          var body = {
            name: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            data: data
          }
          return apiManager.request(this.state.config.safe_endpoint + "/" + this.state.safe.name + "/coin", "POST", body)
          .then(() => {
            toast && messageDispatcher.sendMessage('Notification', {type: "info", message: i18next.t("messageSuccessCoinSave")});
            messageDispatcher.sendMessage('App', {action: "updateCoin", target: this.state.safe, encCoin: body, unlockedCoin: {name: body.name, data: content}, cb: this.scrollToCoin});
          })
          .fail(() => {
            messageDispatcher.sendMessage('Notification', {type: "warning", message: i18next.t("messageErrorCoinSave")});
          })
        });
      }
    } else {
      return Promise.reject("No can do");
    }
  }
  
  scrollToCoin(name) {
    document.getElementById("coin-" + name).scrollIntoView();
  }
  
  manageSafe() {
    var manageSafeModal = new bootstrap.Modal(document.getElementById('manageSafe'), {
      keyboard: false
    });
    manageSafeModal.show();
  }
  
  manageSafeClose() {
    var manageSafeModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#manageSafe'));
    manageSafeModal.hide();
  }

	render() {
    var lockButtonJsx, secretHeaderJsx, secretListJsx = [], spinnerJsx, isUnlocked = (this.state.safe && this.state.safeContent && this.state.safeContent[this.state.safe.name] && this.state.safeContent[this.state.safe.name].key);
    if (this.state.safe && this.state.safeContent && this.state.safeContent[this.state.safe.name] && this.state.safeContent[this.state.safe.name].key) {
      lockButtonJsx =
        <button type="button" className="btn btn-secondary btn-sm" onClick={this.lockSafe} title={i18next.t("safeLock")}>
          <i className="fa fa-lock" aria-hidden="true"></i>
        </button>
      if (this.state.filtering) {
        spinnerJsx =
          <div className="input-group-append">
            <button className="btn btn-outline-secondary" type="button" disabled={true}>
              <i className="fa fa-spinner fa-spin fa-fw"></i>
            </button>
          </div>
      }
      secretHeaderJsx =
        <div className="mb-3">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="input-group mb-3">
              <input type="text"
                     className="form-control"
                     autoComplete="off"
                     placeholder={i18next.t("secretFilter")}
                     id="coinFilter"
                     name="coinFilter"
                     value={this.state.filter}
                     onChange={this.changeFilter}/>
              {spinnerJsx}
            </div>
          </form>
        </div>
    } else {
      lockButtonJsx =
        <button type="button" className="btn btn-secondary btn-sm" onClick={this.unlockSafe} title={i18next.t("safeUnlock")}>
          <i className="fa fa-unlock" aria-hidden="true"></i>
        </button>
    }
    if (isUnlocked) {
      this.state.filteredCoinList.forEach((coin, index) => {
        secretListJsx.push(<Coin config={this.state.config}
                                 coin={coin}
                                 safe={this.state.safe}
                                 cbEditHeader={this.editCoinHeader}
                                 cbRemoveCoin={this.removeCoin}
                                 cbSaveCoin={this.coinSaveCallback}
                                 key={index}/>);
      });
    }
    return (
      <div>
        <div className="alert alert-primary text-center" role="alert">
          {this.state.safe.display_name||this.state.safe.name}
          <div className="btn-group float-end" role="group">
            {lockButtonJsx}
            <button type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={this.editSafe}
                    disabled={!isUnlocked}
                    title={i18next.t("editSafe")}>
              <i className="fa fa-pencil-square-o" aria-hidden="true"></i>
            </button>
            <button type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={this.manageSafe}
                    disabled={!isUnlocked}
                    title={i18next.t("manageSafe")}>
              <i className="fa fa-cogs" aria-hidden="true"></i>
            </button>
            <button type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={this.addCoin}
                    disabled={!isUnlocked}
                    title={i18next.t("addCoin")}>
              <i className="fa fa-plus" aria-hidden="true"></i>
            </button>
            <button type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => this.removeSafe()}
                    disabled={!isUnlocked}
                    title={i18next.t("removeSafe")}>
              <i className="fa fa-trash-o" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        {secretHeaderJsx}
        <div className="row row-cols-1 row-cols-sm-1 row-cols-md-1 row-cols-lg-2">
          {secretListJsx}
        </div>
        <ModalSafeUnlock config={this.state.config}
                         safe={this.state.safe}
                         safeContent={this.state.safeContent}
                         allowKeepUnlocked={true}
                         cb={this.unlockSafeCallback} />
        <ModalCoinEdit editMode={this.state.coinEditMode}
                       name={this.state.coinEditName}
                       content={this.state.coinEditContent}
                       cb={this.coinSaveCallback} />
        <ModalManageSafe config={this.state.config}
                         safe={this.state.safe}
                         safeContent={this.state.safeContent}
                         cbSaveCoin={this.coinSaveCallback}
                         cbClose={this.manageSafeClose} />
        <Confirm name={"removeSafe"} title={i18next.t("removeSafeTitle")} message={i18next.t("removeSafeMessage", {name: this.state.safe.display_name||this.state.safe.name})} cb={this.removeSafeConfirm} />
        <Confirm name={"removeCoin"} title={i18next.t("removeCoinTitle")} message={this.state.removeCoinMessage} cb={this.removeCoinConfirm} />
      </div>
    );
	}
}

export default SafeView;