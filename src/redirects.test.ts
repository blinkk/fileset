import * as manifest from './manifest';
import * as redirects from './redirects';

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

  const routeTrie = new redirects.RouteTrie();
  config.forEach(redirect => {
    const code = redirect.permanent ? 301 : 302;
    const route = new redirects.RedirectRoute(code, redirect.to);
    routeTrie.add(redirect.from, route);
  });

  let [route, params] = routeTrie.get('/foo');
  if (route instanceof redirects.RedirectRoute) {
    const [code, destination] = route.getRedirect(params);
    t.is(code, 301);
    t.is(destination, '/bar');
    numTestsRun++;
  }

  [route, params] = routeTrie.get('/intl/de');
  if (route instanceof redirects.RedirectRoute) {
    const [code, destination] = route.getRedirect(params);
    t.is(code, 302);
    t.is(destination, '/de/');
    numTestsRun++;
  }

  [route, params] = routeTrie.get('/intl/ja/foo');
  if (route instanceof redirects.RedirectRoute) {
    const [code, destination] = route.getRedirect(params);
    t.is(code, 302);
    t.is(destination, '/ja/foo');
    numTestsRun++;
  }

  t.is(numTestsRun, 3);
});
