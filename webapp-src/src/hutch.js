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
import { createRoot } from 'react-dom/client';
import i18next from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

import { importJWK, jwtVerify } from 'jose-browser-runtime';

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
      return importJWK(backendConfig.jwks.keys[0], backendConfig.jwks.keys[0].alg)
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
  const container = document.getElementById('root');
  const root = createRoot(container);
  const urlParams = new URLSearchParams(window.location.search);
  apiManager.request("config.json")
  .then((frontEndConfig) => {
    if (!frontEndConfig.lang) {
      frontEndConfig.lang = ["en","fr"];
    }
    if (!frontEndConfig.offline) {
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
          storagePrefix: "hutchOidc",
          storageType: storage.storageType,
          responseType: storage.getValue("longSession")?"code":"token id_token",
          openidConfigUrl: config.oidc_server_remote_config,
          authUrl: frontEndConfig.oidc.authUrl,
          tokenUrl: frontEndConfig.oidc.tokenUrl,
          clientId: frontEndConfig.oidc.clientId,
          redirectUri: frontEndConfig.oidc.redirectUri,
          usePkce: frontEndConfig.oidc.usePkce,
          scope: config.scope,
          userinfoUrl: frontEndConfig.oidc.userinfoUrl,
          refreshTokenLoop: frontEndConfig.oidc.refreshTokenLoop,
          changeStatusCb: function (newStatus, token, expires_in, profile) {
            messageDispatcher.sendMessage('OIDC', {status: newStatus, token: token, expires_in: expires_in, profile: profile});
          }
        });
        apiManager.setConfig(frontEndConfig.APIUrl);
        root.render(<App config={config} />);
      })
      .fail((error) => {
        root.render(<ErrorConfig message={"Error getting hutch backend config"}/>);
      });
    } else {
      var config = {
        oidc: false,
        frontend: frontEndConfig,
        backend: false,
        jwks: false,
        profile_endpoint: false,
        safe_endpoint: false,
        oidc_server_remote_config: false,
        scope: false
      };
      root.render(<App config={config} />);
    }
  })
  .fail((error) => {
    root.render(<ErrorConfig message={"Error getting hutch frontend config"}/>);
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
                    '<span class="btn-icon-right">You must use a browser compatible with Hutch</span>' +
                  '</div>');
}
