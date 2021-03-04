import * as manifest from './manifest';
import * as trie from './trie';

import {ExecutionContext} from 'ava';
import test from 'ava';

test('Test redirects', (t: ExecutionContext) => {
  let numTestsRun = 0;
  const config: manifest.Redirect[] = [
    {
      from: '/foo',
      to: '/bar',
      permanent: true,
    },
    {
      from: '/intl/:locale/',
      to: '/$locale/',
    },
    {
      from: '/intl/:locale/*wildcard',
      to: '/$locale/$wildcard',
    },
  ];

  const routeTrie = new trie.RouteTrie();
  config.forEach(redirect => {
    const code = redirect.permanent ? 301 : 302;
    const route = new trie.RedirectRoute(code, redirect.to);
    routeTrie.add(redirect.from, route);
  });
  routeTrie.add(
    '/page/',
    new trie.CustomHeaderRoute({
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    })
  );
  routeTrie.add(
    '/*',
    new trie.CustomHeaderRoute({
      'X-Wildcard-Foo': 'Bar',
    })
  );
  routeTrie.add(
    '/foo/*',
    new trie.CustomHeaderRoute({
      'X-Wildcard-Foo': 'Foo-Bar',
    })
  );

  let [route, params] = routeTrie.get('/foo');
  if (route instanceof trie.RedirectRoute) {
    const [code, destination] = route.getRedirect(params);
    t.is(code, 301);
    t.is(destination, '/bar');
    numTestsRun++;
  }

  [route, params] = routeTrie.get('/intl/de');
  if (route instanceof trie.RedirectRoute) {
    const [code, destination] = route.getRedirect(params);
    t.is(code, 302);
    t.is(destination, '/de/');
    numTestsRun++;
  }

  [route, params] = routeTrie.get('/intl/ja/foo');
  if (route instanceof trie.RedirectRoute) {
    const [code, destination] = route.getRedirect(params);
    t.is(code, 302);
    t.is(destination, '/ja/foo');
    numTestsRun++;
  }

  [route, params] = routeTrie.get('/page/');
  if (route instanceof trie.CustomHeaderRoute) {
    const headers = route.getHeaders();
    t.deepEqual(
      {
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
      headers
    );
    numTestsRun++;
  }

  [route, params] = routeTrie.get('/wildcard/foo/bar/');
  if (route instanceof trie.CustomHeaderRoute) {
    const headers = route.getHeaders();
    t.deepEqual(
      {
        'X-Wildcard-Foo': 'Bar',
      },
      headers
    );
    numTestsRun++;
  }

  [route, params] = routeTrie.get('/foo/bar/');
  if (route instanceof trie.CustomHeaderRoute) {
    const headers = route.getHeaders();
    t.deepEqual(
      {
        'X-Wildcard-Foo': 'Foo-Bar',
      },
      headers
    );
    numTestsRun++;
  }

  [route, params] = routeTrie.get('/foo/bar/baz/');
  if (route instanceof trie.CustomHeaderRoute) {
    const headers = route.getHeaders();
    t.deepEqual(
      {
        'X-Wildcard-Foo': 'Foo-Bar',
      },
      headers
    );
    numTestsRun++;
  }

  t.is(numTestsRun, 7);
});
