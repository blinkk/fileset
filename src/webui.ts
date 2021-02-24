import express = require('express');

import * as api from './api';
import * as fsPath from 'path';
import * as nunjucks from 'nunjucks';
import * as passport from 'passport';

import {Strategy} from 'passport-google-oauth20';
import {ensureLoggedIn} from 'connect-ensure-login';

import CookieSession = require('cookie-session');

export const Urls = {
  CALLBACK: `${
    process.env.FILESET_BASE_URL
      ? 'https://' + process.env.FILESET_BASE_URL
      : ''
  }/fileset/oauth2callback`,
  ERROR: '/fileset/error',
  LOGIN: '/fileset/login',
};

const authOptions = {
  scope: ['email', 'profile'],
  successReturnToOrRedirect: '/',
  failureRedirect: Urls.ERROR,
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
  const clientId = process.env.FILESET_CLIENT_ID;
  const clientSecret = process.env.FILESET_CLIENT_SECRET;
  const sessionSecret = process.env.FILESET_SESSION_SECRET;

  if (!clientId || !clientSecret || !sessionSecret) {
    throw new Error(
      'Must specify environment variables: FILESET_CLIENT_ID, FILESET_CLIENT_SECRET, FILESET_SESSION_SECRET'
    );
  }

  // Needed to enforce https with callback URL. https://stackoverflow.com/a/20848306
  app.enable('trust proxy');
  passport.use(
    new Strategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: Urls.CALLBACK,
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

  app.use(
    CookieSession({
      name: 'fileset.session',
      keys: [sessionSecret],
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.get(Urls.LOGIN, passport.authenticate('google', authOptions));
  app.get(Urls.CALLBACK, passport.authenticate('google', authOptions));
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
    } catch (e) {
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
