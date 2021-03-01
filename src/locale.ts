import * as acceptlang from 'accept-language-parser';

import {getCountry} from 'country-language';

import express = require('express');

const DEFAULT_COUNTRY = 'US';
const DEFAULT_LANG = 'en';

export function getFallbackLocales(req: express.Request): string[] {
  const countryCode = (
    (req.query.gl && (req.query.gl as string)) ||
    req.get('x-appengine-country') ||
    DEFAULT_COUNTRY
  ).toUpperCase();
  const locales = new Set();

  // Add locales from ?hl= query parameter.
  if (req.query.hl) {
    const langCode = req.query.hl as string;
    locales.add(`${langCode}_${countryCode}`);
    locales.add(langCode);
  }

  const langs = getFallbackLanguages(req, countryCode);

  // Add `lang_country` locales.
  langs.forEach(langCode => {
    locales.add(`${langCode}_${countryCode}`);
  });

  // Add `lang`-only locales.
  langs.forEach(langCode => {
    locales.add(langCode);
  });

  return Array.from(locales) as string[];
}

function getFallbackLanguages(
  req: express.Request,
  countryCode = DEFAULT_COUNTRY
): string[] {
  const langs = new Set();

  // Add languages from the Accept-Language header.
  const acceptLangHeader = req.get('accept-language') || '';
  if (acceptLangHeader) {
    acceptlang.parse(acceptLangHeader).forEach(lang => {
      if (lang.region) {
        langs.add(`${lang.code}-${lang.region}`);
      } else {
        langs.add(lang.code);
      }
    });
  }

  // Add languages from the user's country.
  getCountryLanguages(countryCode).forEach(lang => langs.add(lang));

  // Fall back to "en" as a last resort.
  if (!langs.has(DEFAULT_LANG)) {
    langs.add(DEFAULT_LANG);
  }

  return Array.from(langs) as string[];
}

function getCountryLanguages(countryCode: string): string[] {
  // Special overrides for Chinese-speaking countries.
  if (countryCode === 'CN') {
    return ['zh-CN', 'zh-Hans', 'zh-Hant', 'zh'];
  }
  if (countryCode === 'HK') {
    return ['zh-HK', 'zh-Hant', 'zh'];
  }
  if (countryCode === 'TW') {
    return ['zh-TW', 'zh-Hant', 'zh'];
  }

  const country = getCountry(countryCode);
  // The `getCountry` function returns an error string if the country code is
  // invalid.
  if (typeof country !== 'object') {
    return [];
  }

  const langs = new Set();
  // E.g. "en-CA", "fr-CA"
  if (country.langCultureMs && country.langCultureMs.length) {
    country.langCultureMs.forEach(langCulture => {
      langs.add(langCulture.langCultureName);
    });
  }
  // E.g. "en", "fr"
  if (country.languages && country.languages.length) {
    country.languages.forEach(lang => langs.add(lang.iso639_1));
  }
  return Array.from(langs) as string[];
}
