import * as server from './server';

import {ExecutionContext} from 'ava';
import test from 'ava';

test('Test parseHostname', (t: ExecutionContext) => {
  // App Engine wildcard domain.
  t.deepEqual(
    server.parseHostname('sitename-refname-dot-fileset2-dot-appid.appspot.com'),
    {
      siteId: 'sitename',
      branchOrRef: 'refname',
    }
  );
  // Custom live domain.
  t.deepEqual(server.parseHostname('example.com', 'example', 'example.com'), {
    siteId: 'example',
    branchOrRef: 'master',
  });
  // Multiple live domains.
  t.deepEqual(
    server.parseHostname('example.com', 'example', 'example.com,foo.com'),
    {
      siteId: 'example',
      branchOrRef: 'master',
    }
  );
  // Some other domain.
  t.deepEqual(server.parseHostname('something.com', 'example', 'example.com'), {
    siteId: 'example',
    branchOrRef: '',
  });
});
