import * as server from './server';

import {ExecutionContext} from 'ava';
import test from 'ava';

test('Test parseHostnamePrefix', (t: ExecutionContext) => {
  t.deepEqual(server.parseHostnamePrefix('0d60edf.localhost'), {
    siteId: '',
    branchOrRef: '0d60edf',
  });
});

test('Test parseHostname', (t: ExecutionContext) => {
  // App Engine wildcard domain.
  t.deepEqual(
    server.parseHostname('sitename-refname-dot-fileset2-dot-appid.appspot.com'),
    {
      siteId: 'sitename',
      branchOrRef: 'refname',
    }
  );
  // App Engine wildcard domain, no sitename provided.
  t.deepEqual(
    server.parseHostname('refname-dot-fileset2-dot-appid.appspot.com'),
    {
      siteId: 'default',
      branchOrRef: 'refname',
    }
  );
  // Custom staging domain.
  t.deepEqual(
    server.parseHostname('example.com', 'example', 'https://example.com'),
    {
      siteId: 'example',
      branchOrRef: 'main',
    }
  );
  // Custom staging domain.
  t.deepEqual(
    server.parseHostname('foo.example.com', 'example', 'https://example.com'),
    {
      siteId: 'example',
      branchOrRef: 'foo',
    }
  );
  // Custom staging domain with site and ref.
  t.deepEqual(
    server.parseHostname(
      'foo-bar.example.com',
      'example',
      'https://example.com'
    ),
    {
      siteId: 'foo',
      branchOrRef: 'bar',
    }
  );

  t.deepEqual(
    server.parseHostname('0d60edf.localhost:8080', '', 'http://localhost:8080'),
    {
      siteId: 'default',
      branchOrRef: '0d60edf',
    }
  );
});
