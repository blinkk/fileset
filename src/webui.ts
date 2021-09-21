import express = require('express');

import * as api from './api';
import * as fsPath from 'path';
import * as nunjucks from 'nunjucks';
import * as passport from 'passport';

import {Strategy} from 'passport-google-oauth20';
import {URL} from 'url';
import {ensureLoggedIn} from 'connect-ensure-login';

import CookieSession = require('cookie-session');

export const Urls = {
  CALLBACK: '/fileset/oauth2callback',
  ERROR: '/fileset/error',
  LOGIN: '/fileset/login',
};

export function renderAccessDenied(
  app: express.Application,
  req: express.Request,
  res: express.Response
) {
  nunjucks.configure(fsPath.join(__dirname, './static/'), {
    autoescape: true,
    express: app,
  });
  res.status(403);
  res.render('access-denied.njk', {
    me: req.user,
  });
}

export function getConfig() {
  return {
    clientId: process.env.FILESET_CLIENT_ID || '',
    clientSecret: process.env.FILESET_CLIENT_SECRET || '',
    sessionSecret: process.env.FILESET_SESSION_SECRET || '',
  };
}

export function isEnabled() {
  const config = getConfig();
  return (
    Boolean(config.clientId) &&
    Boolean(config.clientSecret) &&
    Boolean(config.sessionSecret)
  );
}

export function isUserAllowed(email: string) {
  const allowedOrganizations = (process.env.FILESET_ALLOWED_ORGANIZATIONS || '')
    .split(',')
    .map(org => org.toLowerCase());
  // If no allowed organizations are set, this server is a live/prod server only.
  if (!allowedOrganizations) {
    return false;
  }
  const organizationFromEmail = email.split('@')[1].toLowerCase();
  return allowedOrganizations.includes(organizationFromEmail);
}

export function configure(app: express.Application) {
  const config = getConfig();
  const clientId = config.clientId;
  const clientSecret = config.clientSecret;
  const sessionSecret = config.sessionSecret;

  // Need to manually specify the base URL in the environment as it needs to
  // match the Google OAuth 2.0 redirect URI.
  let baseUrl = '';
  if (process.env.FILESET_BASE_URL) {
    if (process.env.FILESET_BASE_URL.startsWith('http')) {
      baseUrl = process.env.FILESET_BASE_URL;
    } else {
      baseUrl = `https://${process.env.FILESET_BASE_URL}`;
    }
  }
  // Needed to enforce https with callback URL. https://stackoverflow.com/a/20848306
  app.enable('trust proxy');
  passport.use(
    new Strategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: `${baseUrl}${Urls.CALLBACK}`,
      },
      (accessToken, refreshToken, profile, cb) => {
        return cb(undefined, profile);
      }
    )
  );

  passport.serializeUser((user, cb) => {
    cb(null, user);
  });

  passport.deserializeUser((obj, cb) => {
    // @ts-ignore
    cb(null, obj);
  });

  const outgoingReturnToMiddleware = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const authOptions = {
      scope: ['email', 'profile'],
      successReturnToOrRedirect: '/',
      failureRedirect: Urls.ERROR,
      state: (req.query.returnUrl as string) || undefined,
    };
    passport.authenticate('google', authOptions)(req, res, next);
  };

  const incomingReturnToMiddleware = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const host = req.hostname.endsWith('localhost')
      ? `${req.hostname}:${process.env.PORT || 8080}`
      : req.hostname;
    let authOptions;
    if (req.query.state) {
      // Example current URL (trusted): https://fileset.com/bar/.
      // Example original URL (untrusted): https://foo.fileset.com/bar/.
      const currentUrl = new URL(`${req.protocol}://${host}${req.originalUrl}`);
      const originalUrl = new URL(req.query.state as string);
      // If using the `FILESET_BASE_URL` feature, which allows for custom hostnames, replace
      // the App Engine `-dot-` hostname with the `BASE_URL` hostname and redirect.
      const defaultHostnamePart = `fileset-dot-${process.env.GOOGLE_CLOUD_PROJECT}.appspot.com`;
      if (
        originalUrl.host.includes(defaultHostnamePart) &&
        process.env.FILESET_BASE_URL
      ) {
        originalUrl.host = originalUrl.host
          .replace(defaultHostnamePart, process.env.FILESET_BASE_URL)
          .replace('-dot-', '.');
      }
      // Verify the `?returnTo` and `state` parameters are not external URLs.
      // Subdomains (i.e. staging environment URLs) are permitted, as they are
      // trusted.
      if (!originalUrl.host.endsWith(currentUrl.host)) {
        res.status(400);
        res.contentType('text/plain');
        res.send('External redirects are disallowed.');
        return;
      }
      // Short-circuit the OAuth flow and redirect to the staging URL's
      // subdomain, which will resume the flow and pick it up. This allows us to
      // have one canonical domain to act as the redirect URI from Google, and
      // forward the OAuth callback parameters to all staging environment
      // subdomains.
      if (currentUrl.host !== originalUrl.host) {
        currentUrl.host = originalUrl.host;
        res.redirect(302, currentUrl.toString());
        return;
      }
      const successRedirect = originalUrl.search
        ? `${originalUrl.pathname}${originalUrl.search}`
        : originalUrl.pathname;
      authOptions = {
        scope: ['email', 'profile'],
        failureRedirect: Urls.ERROR,
        successRedirect: successRedirect,
      };
    } else {
      authOptions = {
        scope: ['email', 'profile'],
        failureRedirect: Urls.ERROR,
        successReturnToOrRedirect: '/',
      };
    }
    passport.authenticate('google', authOptions)(req, res, next);
  };

  app.use(
    CookieSession({
      name: 'fileset.session',
      keys: [sessionSecret],
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.get(Urls.LOGIN, outgoingReturnToMiddleware);
  app.get(Urls.CALLBACK, incomingReturnToMiddleware);
  app.get(Urls.ERROR, (req, res) => {
    res.send('Something went wrong with authentication.');
  });

  app.use(
    '/fileset/static/',
    ensureLoggedIn(Urls.LOGIN),
    express.static(fsPath.join(__dirname, './static/'))
  );

  app.post('/fileset/api/*', ensureLoggedIn(Urls.LOGIN), async (req, res) => {
    // @ts-ignore
    if (!isUserAllowed(req.user.emails[0].value)) {
      renderAccessDenied(app, req, res);
      return;
    }
    try {
      const apiHandler = new api.ApiHandler();
      const method = req.path.slice('/fileset/api/'.length);
      const reqData = req.body || {};
      const data = await apiHandler.handle(req, method, reqData);
      return res.json({
        success: true,
        data: data,
      });
    } catch (e: any) {
      console.error(e);
      if (e.stack) {
        console.error(e.stack);
      }
      return res.status(500).json({
        success: false,
        error: 'unknown server error',
      });
    }
  });

  app.all(
    '/fileset/*',
    ensureLoggedIn(Urls.LOGIN),
    async (req: express.Request, res: express.Response) => {
      // @ts-ignore
      if (!isUserAllowed(req.user.emails[0].value)) {
        renderAccessDenied(app, req, res);
        return;
      }
      return res.sendFile(fsPath.join(__dirname, './static/', 'webui.html'));
    }
  );
}
