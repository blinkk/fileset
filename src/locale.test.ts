import * as locale from './locale';

import {ExecutionContext} from 'ava';
import test from 'ava';

import express = require('express');

function mockRequest(
  hlParam: string | undefined,
  glParam: string | undefined,
  acceptLanguageHeader: string,
  countryHeader: string
) {
  return ({
    query: {
      hl: hlParam,
      gl: glParam,
    },
    get: (arg: string | undefined) => {
      if (arg === 'accept-language') {
        return acceptLanguageHeader;
      } else if (arg === 'x-appengine-country') {
        return countryHeader;
      }
      throw new Error(`Missing mock for header: ${arg}`);
    },
  } as unknown) as express.Request;
}

test('Test locale', (t: ExecutionContext) => {
  t.deepEqual(
    locale.getFallbackLocales(mockRequest(undefined, undefined, 'ja', 'JP')),
    ['ja_JP', 'ja-JP_JP', 'en_JP', 'ja', 'ja-JP', 'en']
  );
  t.deepEqual(
    locale.getFallbackLocales(mockRequest('de', undefined, 'de', 'US')),
    ['de_US', 'de', 'en-US_US', 'en_US', 'en-US', 'en']
  );
  // ?hl=de&gl=US
  t.deepEqual(locale.getFallbackLocales(mockRequest('de', 'US', 'de', 'DE')), [
    'de_US',
    'de',
    'en-US_US',
    'en_US',
    'en-US',
    'en',
  ]);
  // ?hl=de&gl=DE
  t.deepEqual(locale.getFallbackLocales(mockRequest('de', 'DE', 'de', 'US')), [
    'de_DE',
    'de',
    'de-DE_DE',
    'en_DE',
    'de-DE',
    'en',
  ]);
  t.deepEqual(
    locale.getFallbackLocales(mockRequest(undefined, undefined, 'de', 'US')),
    ['de_US', 'en-US_US', 'en_US', 'de', 'en-US', 'en']
  );
});
