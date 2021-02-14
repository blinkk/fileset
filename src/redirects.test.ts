import * as manifest from './manifest';
import * as redirects from './redirects';

import {ExecutionContext} from 'ava';
import test from 'ava';

test('Test redirects', (t: ExecutionContext) => {
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

  const [route, params] = routeTrie.get('/foo');
  if (route) {
    const [code, destination] = (route as redirects.RedirectRoute).getRedirect(
      params
    );
    t.is(code, 301);
    t.is(destination, '/bar');
  }
});
