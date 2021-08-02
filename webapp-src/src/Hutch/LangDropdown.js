import React, { Component } from 'react';

import i18next from 'i18next';

import messageDispatcher from '../lib/MessageDispatcher';

class LangDropdown extends Component {
  constructor(props) {
    super(props);

    this.state = {
      config: props.config
    };
    
    this.changeLang = this.changeLang.bind(this);
  }
  
  changeLang(e, lang) {
    e.preventDefault();
    messageDispatcher.sendMessage("App", {action: 'lang', lang: lang});
  }
  
	render() {
    var langList = [];
    this.state.config.frontend.lang.forEach((lang, index) => {
      var classValue = "dropdown-item";
      if (i18next.language === lang) {
        classValue += " active"
      }
      langList.push(
        <li key={index}><a className={classValue} href="#" onClick={(e) => this.changeLang(e, lang)}>{lang}</a></li>
      );
    });
    return (
      <li className="nav-item dropdown">
        <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          {i18next.t("lang")}
        </a>
        <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
          {langList}
        </ul>
      </li>
    );
	}
}

export default LangDropdown;
