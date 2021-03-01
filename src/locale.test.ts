import * as locale from './locale';

import {ExecutionContext} from 'ava';
import test from 'ava';

import express = require('express');

test('Test locale', (t: ExecutionContext) => {
  t.deepEqual(
    locale.getFallbackLocales(({
      query: {
        hl: null,
      },
      get: (arg: string) => {
        if (arg === 'accept-language') {
          return 'ja';
        } else {
          return 'JP';
        }
      },
    } as unknown) as express.Request),
    ['ja_JP', 'ja-JP_JP', 'en_JP', 'ja', 'ja-JP', 'en']
  );
  t.deepEqual(
    locale.getFallbackLocales(({
      query: {
        hl: 'de',
      },
      get: (arg: string) => {
        if (arg === 'accept-language') {
          return 'de';
        } else {
          return 'US';
        }
      },
    } as unknown) as express.Request),
    ['de_US', 'de', 'en-US_US', 'en_US', 'en-US', 'en']
  );
  t.deepEqual(
    locale.getFallbackLocales(({
      query: {
        hl: null,
      },
      get: (arg: string) => {
        if (arg === 'accept-language') {
          return 'de';
        } else {
          return 'US';
        }
      },
    } as unknown) as express.Request),
    ['de_US', 'en-US_US', 'en_US', 'de', 'en-US', 'en']
  );
});
