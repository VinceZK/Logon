/**
 * Created by VinceZK on 5/27/18.
 */
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Message = require('ui-message').Message;
const MsgFileStore = require('ui-message').MsgFileStore;
const path = require('path');
const Authorization = require('node-authorization').Authorization;
const compileProfile = require('node-authorization').profileCompiler;
const fs = require('fs');

const msgStore = new MsgFileStore(path.join(__dirname, '../../data/message.json'));
const message = new Message(msgStore, 'EN');

passport.use(new LocalStrategy(
  function (username, password, done) {
    if (username === 'zklee@hotmail.com' && password === 'dark1234') {
      let _profile =
        compileProfile(JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/authProfile.json'), 'utf8')));
      const loginUser =
        { userid: 'VinceZK',
          email: 'zklee@hotmail.com',
          displayName: 'Vincent Zhang',
          userProfile: _profile,
          pwdState: 0
        };
      return done(null, loginUser);
    } else {
      return done(message.reportShortText('LOGON', 'USER_PASSWORD_WRONG', 'E'));
    }
  }),);

passport.serializeUser(function (loginUser, done) {
  console.log('serialize the user: ');
  done(null, loginUser);
},);

passport.deserializeUser(function (loginUser, done) {
  console.log('deserialize the user');
  if(loginUser.userid && loginUser.userProfile)
    loginUser.Authorization = new Authorization(loginUser.userid, loginUser.userProfile);
  done(null, loginUser);
},);

module.exports = {
  logon: function (req, res, next) {
    passport.authenticate('local', function(err, user){
      const data = {
        err: null,
        user: null
      };  //Response Data

      if(err) {
        data.err = err;
        return res.json(data); //Logon Error
      }

      if(user){
        req.logIn(user, function(err) {
          if (err) return next(err);
          // setTimeout(()=>res.json(user), 3000);
          data.user = user;
          res.json(data);  //Response the user
        });
      }
    })(req, res, next);
  },

  logout: function (req, res) {
    if (req.user) {
      req.logout();
      res.status(200).end();
    } else {
      res.status(400).send('Not Logged in');
    }
  },

  ensureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).send('Unauthenticated!');
    }
  },

  renewPWD: function (req, res) {

  },
};

