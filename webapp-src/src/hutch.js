/**
 * 
 * Hutch front-end application
 * 
 * Copyright 2021 Nicolas Mora <mail@babelouest.org>
 * 
 * License AGPL
 * 
 */

import React from 'react';
import ReactDOM from 'react-dom';
import i18next from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

import { parseJwk } from 'jose/jwk/parse';
import { jwtVerify } from 'jose/jwt/verify';

import App from './Hutch/App';

import storage from './lib/Storage';
import messageDispatcher from './lib/MessageDispatcher';
import apiManager from './lib/APIManager';
import oidcConnector from './lib/OIDCConnector';
import ErrorConfig from './lib/ErrorConfig';

function getServerConfig(rootUrl) {
  var backendConfig = {};
  return apiManager.request(rootUrl+"/.well-known/hutch-configuration", "GET", false, "application/jwt")
  .then((serverConfig) => {
    var serverConfigHeader = JSON.parse(atob(serverConfig.split(".")[0].replace(/-/g, '+').replace(/_/g, '/')));
    backendConfig.config = JSON.parse(atob(serverConfig.split(".")[1].replace(/-/g, '+').replace(/_/g, '/')));
    return apiManager.request(backendConfig.config.jwks_uri, "GET", false, "application/jwt")
    .then((backendJwks) => {
      var backendJwksHeader = JSON.parse(atob(backendJwks.split(".")[0].replace(/-/g, '+').replace(/_/g, '/')));
      backendConfig.jwks = JSON.parse(atob(backendJwks.split(".")[1].replace(/-/g, '+').replace(/_/g, '/')));
      return parseJwk(backendConfig.jwks.keys[0], backendConfig.jwks.keys[0].alg)
      .then((publicKey) => {
        return jwtVerify(serverConfig, publicKey)
        .then(() => {
          return jwtVerify(backendJwks, publicKey)
          .then(() => {
            return backendConfig;
          });
        });
      });
    });
  });
}

var initApp = () => {
  $.toastDefaults.position = 'top-right';
  $.toastDefaults.dismissible = true;
  $.toastDefaults.stackable = true;
  $.toastDefaults.pauseDelayOnHover = true;
  const urlParams = new URLSearchParams(window.location.search);
  apiManager.request("config.json")
  .then((frontEndConfig) => {
    if (!frontEndConfig.lang) {
      frontEndConfig.lang = ["en","fr"];
    }
    storage.setStorageType(frontEndConfig.storageType);
    getServerConfig(frontEndConfig.hutchRootUrl)
    .then((backendConfig) => {
      var config = {
        oidc: {
          status: "connecting"
        },
        frontend: frontEndConfig,
        backend: backendConfig.config,
        jwks: backendConfig.jwks,
        profile_endpoint: frontEndConfig.profile_endpoint || backendConfig.config.profile_endpoint,
        safe_endpoint: frontEndConfig.safe_endpoint || backendConfig.config.safe_endpoint,
        oidc_server_remote_config: frontEndConfig.oidc.oidc_server_remote_config || backendConfig.config.oidc_server_remote_config,
        scope: frontEndConfig.oidc.scope || backendConfig.config.scope
      }
      oidcConnector.init({
        storageType: storage.storageType,
        responseType: frontEndConfig.oidc.responseType,
        openidConfigUrl: config.oidc_server_remote_config,
        authUrl: frontEndConfig.oidc.authUrl,
        tokenUrl: frontEndConfig.oidc.tokenUrl,
        clientId: frontEndConfig.oidc.clientId,
        redirectUri: frontEndConfig.oidc.redirectUri,
        scope: config.scope,
        userinfoUrl: frontEndConfig.oidc.userinfoUrl,
        changeStatusCb: function (newStatus, token, expiration) {
          messageDispatcher.sendMessage('OIDC', {status: newStatus, token: token, expiration:expiration});
        }
      });
      apiManager.setConfig(frontEndConfig.APIUrl);
      ReactDOM.render(<App config={config} />, document.getElementById('root'));
    })
    .fail((error) => {
      ReactDOM.render(<ErrorConfig message={"Error getting hutch backend config"}/>, document.getElementById('root'));
    });
  })
  .fail((error) => {
    ReactDOM.render(<ErrorConfig message={"Error getting hutch frontend config"}/>, document.getElementById('root'));
  });
}

try {
  i18next
  .use(Backend)
  .use(LanguageDetector)
  .init({
    fallbackLng: 'en',
    ns: ['translations'],
    defaultNS: 'translations',
    backend: {
      loadPath: 'locales/{{lng}}/{{ns}}.json'
    }
  })
  .then(() => {
    initApp();
  });
} catch (e) {
  $("#root").html('<div class="alert alert-danger" role="alert">' +
                    '<i class="fas fa-exclamation-triangle"></i>' +
                    '<span class="btn-icon-right">You must use a browser compatible with Glewlwyd SSO</span>' +
                  '</div>');
}
