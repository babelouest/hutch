import React, { Component } from 'react';

import i18next from 'i18next';

import apiManager from '../lib/APIManager';
import messageDispatcher from '../lib/MessageDispatcher';

import Confirm from './Confirm';

class ProfileEdit extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config,
      hutchProfile: props.hutchProfile,
      imageError: false,
      nameMandatory: false,
      messageMandatory: false,
      imageMandatory: false,
      imageLoading: false
    };

    this.editProfile = this.editProfile.bind(this);
    this.cancelEditProfile = this.cancelEditProfile.bind(this);
    this.editKey = this.editKey.bind(this);
    this.editMessage = this.editMessage.bind(this);
    this.getRandomWikimediaImage = this.getRandomWikimediaImage.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
    this.onUploadImage = this.onUploadImage.bind(this);
    this.saveProfile = this.saveProfile.bind(this);
    this.removeProfile = this.removeProfile.bind(this);
    this.removeProfileConfirm = this.removeProfileConfirm.bind(this);
  }

  static getDerivedStateFromProps(props, state) {
    return props;
  }

  editProfile() {
    var hutchProfile = this.state.hutchProfile;
    if (!hutchProfile.name) {
      hutchProfile.name = this.state.profile.name;
    }
    if (!hutchProfile.sign_kid) {
      hutchProfile.sign_kid = this.state.config.jwks.keys[0].kid;
    }
    this.setState({editProfile: true, hutchProfile: hutchProfile});
  }

  cancelEditProfile() {
    messageDispatcher.sendMessage('App', {action: "getProfile"});
  }

  editKey(e) {
    var hutchProfile = this.state.hutchProfile;
    hutchProfile.sign_kid = e.target.value;
    this.setState({hutchProfile: hutchProfile});
  }

  editMessage(e) {
    var hutchProfile = this.state.hutchProfile;
    hutchProfile.message = e.target.value;
    this.setState({hutchProfile: hutchProfile});
  }

  editName(e) {
    var hutchProfile = this.state.hutchProfile;
    hutchProfile.name = e.target.value;
    this.setState({hutchProfile: hutchProfile});
  }

  getRandomWikimediaImage() {
    this.setState({imageLoading: true}, () => {
      var urlFile = "https://commons.wikimedia.org/w/api.php?action=query&list=random&rnnamespace=6&rnlimit=1&prop=imageinfo&format=json&origin=*",
          urlThumb = "https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&iiurlwidth=200&format=json&origin=*&titles=";
      $.ajax({
        url: urlFile
      })
      .then((wikiImageName) => {
        $.ajax({
          url: urlThumb+wikiImageName.query.random[0].title
        })
        .then((wikiImageThumbUrl) => {
          var oReq = new XMLHttpRequest();
          oReq.open("GET", wikiImageThumbUrl.query.pages[wikiImageName.query.random[0].id].imageinfo[0].responsiveUrls["1.5"], true);
          oReq.responseType = "arraybuffer";

          oReq.onload = (oEvent) => {
            var arrayBuffer = oReq.response;
            var hutchProfile = this.state.hutchProfile;
            hutchProfile.picture = "data:"+oReq.getResponseHeader("content-type")+";base64,"+btoa(String.fromCharCode.apply(null, new Uint8Array(oReq.response)));
            this.setState({hutchProfile: hutchProfile, imageError: false, imageLoading: false});
          };

          oReq.send(null);
        })
        .fail(() => {
          $.snack("warning", i18next.t("messageErrorWikiImage"));
          this.setState({imageError: true, imageLoading: false});
        });
      })
      .fail(() => {
        $.snack("warning", i18next.t("messageErrorWikiImage"));
        this.setState({imageError: true, imageLoading: false});
      });
    });
  }

  uploadImage() {
    $('#uploadImageInput').trigger('click');
  }

  onUploadImage(event) {
    var fileList = event.target.files;
    if (fileList.length > 0) {
      var file = fileList[0];
      if (file.size > (400 * 1024)) {
        this.setState({imageError: true});
      } else {
        var fr = new FileReader();
        fr.onload = (ev) => {
          var hutchProfile = this.state.hutchProfile;
          hutchProfile.picture = ev.target.result;
          this.setState({hutchProfile: hutchProfile, imageError: false});
        };

        fr.readAsDataURL(file);
      }
    }
  }

  saveProfile(e) {
    e.preventDefault();
    var hutchProfile = this.state.hutchProfile;
    if (!hutchProfile.message || !hutchProfile.name || !hutchProfile.picture) {
      this.setState({messageMandatory: !hutchProfile.message, nameMandatory: !hutchProfile.name, imageMandatory: !hutchProfile.picture});
    } else {
      apiManager.request(this.state.config.profile_endpoint, "PUT", hutchProfile)
      .then(() => {
        messageDispatcher.sendMessage('App', {action: "getProfile"});
        $.snack("info", i18next.t("messageProfileSaved"));
      })
      .fail(() => {
        $.snack("warning", i18next.t("messageErrorSaveProfile"));
      });
    }
  }
  
  removeProfile() {
    var removeModal = new bootstrap.Modal(document.getElementById('removeProfile'), {
      keyboard: false
    });
    removeModal.show();
  }
  
  removeProfileConfirm(result) {
    if (result) {
      apiManager.request(this.state.config.profile_endpoint, "DELETE")
      .then(() => {
        messageDispatcher.sendMessage('App', {action: "resetProfile"});
        $.snack("info", i18next.t("messageRemoveProfile"));
      })
      .fail(() => {
        $.snack("warning", i18next.t("messageErrorSaveProfile"));
      });
    }
    var removeModal = bootstrap.Modal.getOrCreateInstance(document.querySelector('#removeProfile'));
    removeModal.hide();
  }

	render() {
    var keysJsx = [], imageJsx, imageErrorJsx, messageErrorJsx, nameErrorJsx;
    this.state.config.jwks.keys.forEach((key, index) => {
      keysJsx.push(<option value={key.kid} key={index}>{key.alg}</option>);
    });
    if (this.state.imageLoading) {
      imageJsx = c
    } else if (this.state.hutchProfile.picture) {
      imageJsx = <img src={this.state.hutchProfile.picture} alt="profile image" className="profile-image"/>
    }
    var messageClass = "form-control";
    if (this.state.messageMandatory) {
      messageClass += " is-invalid";
      messageErrorJsx =
        <div className="invalid-feedback">
          {i18next.t("profileMessageMandatory")}
        </div>
    }
    var nameClass = "form-control";
    if (this.state.nameMandatory) {
      nameClass += " is-invalid";
      nameErrorJsx =
        <div className="invalid-feedback">
          {i18next.t("profileNameMandatory")}
        </div>
    }
    if (this.state.imageMandatory) {
      imageErrorJsx =
        <div className="alert alert-danger">
          {i18next.t("profileImageMandatory")}
        </div>
    }
    return (
      <div>
        <form onSubmit={this.saveProfile}>
          <div className="mb-3">
            <label htmlFor="keyList" className="form-label">{i18next.t("profileServerKey")}</label>
            <select className="form-select" aria-label="public key" id="keyList" onChange={(e) => this.editKey(e)} value={this.state.hutchProfile.sign_kid}>
              {keysJsx}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="profileName" className="form-label">{i18next.t("profileName")}</label>
            <input type="text" className={nameClass} id="profileName" value={this.state.hutchProfile.name||""} onChange={(e) => this.editName(e)}/>
            {nameErrorJsx}
          </div>
          <div className="mb-3">
            <label htmlFor="profileMessage" className="form-label">{i18next.t("profileMessage")}</label>
            <textarea className={messageClass} id="profileMessage" value={this.state.hutchProfile.message||""} onChange={(e) => this.editMessage(e)} maxLength="512"></textarea>
            {messageErrorJsx}
          </div>
          <div className="mb-3">
            <label className="form-label">{i18next.t("profileImage")}</label>
            <div>
              {imageJsx}
              {imageErrorJsx}
            </div>
          </div>
          <div className="mb-3">
            <input type="file"
                   id="uploadImageInput"
                   onChange={this.onUploadImage}
                   accept=".jpg,.jpg,.png,.gif,.bmp"
                   className="upload"/>
            <button type="button" className="btn btn-secondary" onClick={this.uploadImage}>{i18next.t("profileImageSelect")}</button>
            <span className="badge bg-secondary btn-icon btn-icon-right">{i18next.t("or")}</span>
            <button type="button" className="btn btn-secondary" onClick={this.getRandomWikimediaImage}>{i18next.t("profileImageRandom")}</button>
          </div>
          <hr/>
          <div className="btn-toolbar justify-content-between" role="toolbar">
            <div className="btn-group" role="group">
              <button type="submit" className="btn btn-primary" onClick={this.saveProfile}>{i18next.t("profileSubmit")}</button>
              <button type="button" className="btn btn-secondary" onClick={this.cancelEditProfile}>{i18next.t("profileCancel")}</button>
            </div>
            <div className="input-group">
              <button type="button" className="btn btn-danger" onClick={this.removeProfile}>
                <i className="fa fa-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </form>
        <Confirm name={"removeProfile"} title={i18next.t("removeProfileTitle")} message={i18next.t("removeProfileMessage")} cb={this.removeProfileConfirm} />
      </div>
    );
	}
}

export default ProfileEdit;
