import {ExecutionContext} from 'ava';
import {getCountry} from './countries';
import test from 'ava';

test('Test getCountry', (t: ExecutionContext) => {
  t.deepEqual(getCountry('US'), {
    name: 'United States',
    code: 'US',
    languages: [{iso639_1: 'en'}],
    langCultureMs: [
      {
        langCultureName: 'en-US',
        cultureCode: '0x0409',
        displayName: 'English - United States',
      },
    ],
  });
  t.is(getCountry('xxx'), null);
});
