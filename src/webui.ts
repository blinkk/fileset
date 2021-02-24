import express = require('express');

import * as api from './api';
import * as expressSession from 'express-session';
import * as fsPath from 'path';
import * as passport from 'passport';

import {Strategy} from 'passport-google-oauth20';
import {ensureLoggedIn} from 'connect-ensure-login';

export const Urls = {
  CALLBACK: '/fileset/oauth2callback',
  ERROR: '/fileset/error',
  LOGIN: '/fileset/login',
};

const authOptions = {
  scope: ['email', 'profile'],
  successReturnToOrRedirect: '/',
  failureRedirect: Urls.ERROR,
};

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
      'Must specify environment variables: FILESET_CLIENT_ID, FILESET_CLIENT_SECRET'
    );
  }

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
    expressSession({
      proxy: false, // Needed for GCS proxy.
      secret: sessionSecret,
      resave: true,
      saveUninitialized: false,
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
      return res.status(403);
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
        return res.status(403);
      }
      return res.sendFile(fsPath.join(__dirname, './static/', 'webui.html'));
    }
  );
}
