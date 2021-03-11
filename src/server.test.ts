import * as server from './server';

import {ExecutionContext} from 'ava';
import test from 'ava';

test('Test parseHostname', (t: ExecutionContext) => {
  t.deepEqual(
    server.parseHostname({
      hostname: 'example.com',
    }),
    [
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );
  t.deepEqual(
    server.parseHostname({
      hostname: 'www.example.com',
    }),
    [
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );
  t.deepEqual(
    server.parseHostname({
      hostname: '0d60edf.localhost',
    }),
    [
      {
        branchOrRef: '0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'workspace/0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'feature/0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'b/0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );
  t.deepEqual(
    server.parseHostname({
      hostname: 'feature--foo.localhost',
    }),
    [
      {
        branchOrRef: 'feature--foo',
        siteId: 'default',
      },
      {
        branchOrRef: 'feature/foo',
        siteId: 'default',
      },
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );
  // App Engine wildcard domain.
  t.deepEqual(
    server.parseHostname({
      hostname: 'sitename-refname-dot-fileset2-dot-appid.appspot.com',
    }),
    [
      {
        branchOrRef: 'refname',
        siteId: 'sitename',
      },
      {
        branchOrRef: 'workspace/refname',
        siteId: 'sitename',
      },
      {
        branchOrRef: 'feature/refname',
        siteId: 'sitename',
      },
      {
        branchOrRef: 'b/refname',
        siteId: 'sitename',
      },
      {
        branchOrRef: 'sitename-refname',
        siteId: 'default',
      },
      {
        branchOrRef: 'workspace/sitename-refname',
        siteId: 'default',
      },
      {
        branchOrRef: 'feature/sitename-refname',
        siteId: 'default',
      },
      {
        branchOrRef: 'b/sitename-refname',
        siteId: 'default',
      },
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );

  // App Engine wildcard domain, no sitename provided.
  t.deepEqual(
    server.parseHostname({
      hostname: 'refname-dot-fileset2-dot-appid.appspot.com',
    }),
    [
      {
        branchOrRef: 'refname',
        siteId: 'default',
      },
      {
        branchOrRef: 'workspace/refname',
        siteId: 'default',
      },
      {
        branchOrRef: 'feature/refname',
        siteId: 'default',
      },
      {
        branchOrRef: 'b/refname',
        siteId: 'default',
      },
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );
  t.deepEqual(
    server.parseHostname({
      hostname: 'feature--foo-dot-fileset2-dot-appid.appspot.com',
    }),
    [
      {
        branchOrRef: 'feature--foo',
        siteId: 'default',
      },
      {
        branchOrRef: 'feature/foo',
        siteId: 'default',
      },
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );
  t.deepEqual(
    server.parseHostname({
      hostname: 'appid.appspot.com',
    }),
    [
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );
  // App Engine wildcard domain, no sitename or refname provided.
  // NOTE: Conflict when GAE service and branch are both named "fileset2", and
  // when the baseUrl is not supplied.
  t.deepEqual(
    server.parseHostname({
      hostname: 'fileset2-dot-appid.appspot.com',
    }),
    [
      {
        branchOrRef: 'fileset2',
        siteId: 'default',
      },
      {
        branchOrRef: 'workspace/fileset2',
        siteId: 'default',
      },
      {
        branchOrRef: 'feature/fileset2',
        siteId: 'default',
      },
      {
        branchOrRef: 'b/fileset2',
        siteId: 'default',
      },
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );
  // When baseUrl is supplied, no conflict exists.
  t.deepEqual(
    server.parseHostname({
      hostname: 'fileset2-dot-appid.appspot.com',
      baseUrl: 'fileset2-dot-appid.appspot.com',
    }),
    [
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );
  // Custom staging domain.
  t.deepEqual(
    server.parseHostname({
      hostname: 'example.com',
      defaultSite: 'example',
      baseUrl: 'https://example.com',
    }),
    [
      {
        branchOrRef: 'main',
        siteId: 'example',
      },
      {
        branchOrRef: 'master',
        siteId: 'example',
      },
    ]
  );
  // Custom staging domain.
  t.deepEqual(
    server.parseHostname({
      hostname: 'foo.example.com',
      defaultSite: 'example',
      baseUrl: 'https://example.com',
    }),
    [
      {
        branchOrRef: 'foo',
        siteId: 'example',
      },
      {
        branchOrRef: 'workspace/foo',
        siteId: 'example',
      },
      {
        branchOrRef: 'feature/foo',
        siteId: 'example',
      },
      {
        branchOrRef: 'b/foo',
        siteId: 'example',
      },
      {
        branchOrRef: 'main',
        siteId: 'example',
      },
      {
        branchOrRef: 'master',
        siteId: 'example',
      },
    ]
  );
  t.deepEqual(
    server.parseHostname({
      hostname: 'foo.example.com',
      defaultSite: 'example',
      baseUrl: 'example.com',
    }),
    [
      {
        branchOrRef: 'foo',
        siteId: 'example',
      },
      {
        branchOrRef: 'workspace/foo',
        siteId: 'example',
      },
      {
        branchOrRef: 'feature/foo',
        siteId: 'example',
      },
      {
        branchOrRef: 'b/foo',
        siteId: 'example',
      },
      {
        branchOrRef: 'main',
        siteId: 'example',
      },
      {
        branchOrRef: 'master',
        siteId: 'example',
      },
    ]
  );
  // Custom staging domain with site and ref.
  t.deepEqual(
    server.parseHostname({
      hostname: 'foo-bar.example.com',
      defaultSite: 'example',
      baseUrl: 'https://example.com',
    }),
    [
      {
        branchOrRef: 'bar',
        siteId: 'foo',
      },
      {
        branchOrRef: 'workspace/bar',
        siteId: 'foo',
      },
      {
        branchOrRef: 'feature/bar',
        siteId: 'foo',
      },
      {
        branchOrRef: 'b/bar',
        siteId: 'foo',
      },
      {
        branchOrRef: 'foo-bar',
        siteId: 'example',
      },
      {
        branchOrRef: 'workspace/foo-bar',
        siteId: 'example',
      },
      {
        branchOrRef: 'feature/foo-bar',
        siteId: 'example',
      },
      {
        branchOrRef: 'b/foo-bar',
        siteId: 'example',
      },
      {
        branchOrRef: 'main',
        siteId: 'example',
      },
      {
        branchOrRef: 'master',
        siteId: 'example',
      },
    ]
  );
  t.deepEqual(
    server.parseHostname({
      hostname: '0d60edf.localhost',
      baseUrl: 'http://localhost:8080',
    }),
    [
      {
        branchOrRef: '0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'workspace/0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'feature/0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'b/0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );
  t.deepEqual(
    server.parseHostname({
      hostname: '0d60edf.localhost',
      baseUrl: 'localhost:8080',
    }),
    [
      {
        branchOrRef: '0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'workspace/0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'feature/0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'b/0d60edf',
        siteId: 'default',
      },
      {
        branchOrRef: 'main',
        siteId: 'default',
      },
      {
        branchOrRef: 'master',
        siteId: 'default',
      },
    ]
  );
});
