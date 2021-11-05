import * as fs from 'fs';
import * as path from 'path';

// This data file was taken from the country-language package on npm.
// The project seems to no longer be supported, so we replicate its
// functionality here.
const DATA = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, '../data/country-language.json'),
    'utf-8'
  )
);

interface Country {
  code: string;
  name: string;
  languages: Language[];
  langCultureMs?: {
    langCultureName: string;
    cultureCode: string;
    displayName: string;
  }[];
}

interface Language {
  iso639_1: string;
}

export function getCountry(countryCode: string): Country | null {
  for (const country of DATA.countries) {
    if (country.code_2 === countryCode) {
      return {
        code: country.code_2,
        name: country.name,
        languages: country.languages.map((lang: string) => {
          return getLanguageData(lang);
        }),
        langCultureMs: country.langCultureMs,
      };
    }
  }
  return null;
}

function getLanguageData(dataLangCode: string): Language | null {
  for (const lang of DATA.languages) {
    if (lang.iso639_2 === dataLangCode) {
      return {
        iso639_1: lang.iso639_1,
      };
    }
  }
  return null;
}
