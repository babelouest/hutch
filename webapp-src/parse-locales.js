#!/usr/bin/env node

const fs = require('fs');

var langList = fs.readdirSync("./dist/locales/");
var translation = {};
var translationSize = 0;

function parseI18N(lang, data, prefix) {
  Object.keys(data).forEach(objKey => {
    if ((typeof data[objKey]) === "string") {
      var trKey = (prefix?prefix+"."+objKey:objKey);
      if (translation[trKey] === undefined) {
        translation[trKey] = [lang];
      } else {
        translation[trKey].push(lang);
      }
    } else if ((typeof data[objKey]) === "object") {
      var newPrefix = (prefix?prefix+"."+objKey:objKey);
      parseI18N(lang, data[objKey], newPrefix);
    }
  });
}

langList.forEach(lang => {
  var file = "./dist/locales/"+lang+"/translations.json"
  console.log("process file", file);
  var data;
  try {
    data = fs.readFileSync("./dist/locales/"+lang+"/translations.json");
  } catch (e) {
    console.log("error reading file", err);
    process.exit(1);
  }
  var parsed;
  try {
    parsed = JSON.parse(data);
  } catch (e) {
    console.log("error parsing file", JSON.stringify(e));
    process.exit(1);
  }
  parseI18N(lang, parsed, false);
  translationSize++;
});

var hasError = false;

Object.keys(translation).forEach(key => {
  if (translation[key].length !== translationSize) {
    hasError = true;
    var difference = langList.filter(x => !translation[key].includes(x));
    console.log("Missing key", difference, key);
  }
});

if (!hasError) {
  console.log("No error in files");
}
