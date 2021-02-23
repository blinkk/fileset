import express = require('express');

import * as api from './api';
import * as expressSession from 'express-session';
import * as fsPath from 'path';
import * as passport from 'passport';

import {Strategy} from 'passport-google-oauth20';
import {ensureLoggedIn} from 'connect-ensure-login';

const Urls = {
  CALLBACK: '/fileset/oauth2callback',
  ERROR: '/fileset/error',
  LOGIN: '/fileset/login',
};

const authOptions = {
  scope: ['profile'],
  successReturnToOrRedirect: '/',
  failureRedirect: Urls.ERROR,
};

export function configure(app: express.Application) {
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const sessionSecret = 'todo-replace-fix-me'; // TODO: Change the session secret.

  if (!clientId || !clientSecret) {
    throw new Error(
      'Must specify environment variables: CLIENT_ID, CLIENT_SECRET'
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
      secret: sessionSecret,
      resave: true,
      saveUninitialized: true,
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
    try {
      const apiHandler = new api.ApiHandler();
      const method = req.path.slice('/fileset/api/'.length);
      const reqData = req.body || {};
      const data = await apiHandler.handle(req, method, reqData);
      res.json({
        success: true,
        data: data,
      });
    } catch (e) {
      console.error(e);
      if (e.stack) {
        console.error(e.stack);
      }
      res.status(500).json({
        success: false,
        error: 'unknown server error',
      });
    }
  });

  app.all(
    '/fileset/*',
    ensureLoggedIn(Urls.LOGIN),
    async (req: express.Request, res: express.Response) => {
      res.sendFile(fsPath.join(__dirname, './static/', 'webui.html'));
    }
  );
}
