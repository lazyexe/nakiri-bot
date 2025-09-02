import { consola } from 'consola';
import fs from 'fs';
import path from 'path';

const translations = {};
let currentLang = 'en';

function loadLang(lang) {
  const file = path.join(import.meta.dirname, '../lang', `${lang}.json`);
  if (fs.existsSync(file)) {
    translations[lang] = JSON.parse(fs.readFileSync(file, 'utf-8'));
  } else {
    consola.warn(`[i18n] Language file '${lang}.json' not found`);
    translations[lang] = {};
  }
}

function getNested(obj, path) {
  return path.split('.').reduce((o, k) => (o || {})[k], obj);
}

function __(key, vars = {}) {
  if (typeof vars !== 'object')
    return consola.warn('[i18n] vars must be an object');

  let string =
    getNested(translations[currentLang], key) ||
    getNested(translations['en'], key) ||
    key;

  for (const [k, v] of Object.entries(vars)) {
    string = string.replaceAll(`{${k}}`, v);
  }

  return string;
}

function setI18n(lang) {
  currentLang = lang;
  if (!translations[lang]) {
    loadLang(lang);
  }
}

setI18n(process.env.APP_LOCALE || currentLang);

global.__ = __;
global.setI18n = setI18n;
