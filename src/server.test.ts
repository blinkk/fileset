import * as server from './server';

import {ExecutionContext} from 'ava';
import test from 'ava';

test('Test parseHostname', (t: ExecutionContext) => {
  t.deepEqual(
    server.parseHostname('sitename-refname-dot-fileset2-dot-appid.appspot.com'),
    {
      siteId: 'sitename',
      branchOrRef: 'refname',
    }
  );
});
