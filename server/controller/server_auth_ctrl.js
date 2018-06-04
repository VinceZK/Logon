/**
 * Created by VinceZK on 5/27/18.
 */
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Message = require('ui-message').Message;
const MsgFileStore = require('ui-message').MsgFileStore;
const path = require('path');

const msgStore = new MsgFileStore(path.join(__dirname, '../../data/message.json'));
const message = new Message(msgStore, 'EN');

passport.use(new LocalStrategy(
  function (username, password, done) {
    if (username === 'zklee@hotmail.com' && password === 'dark1234') {
      const loginUser = {userid: 'VinceZK', email: 'zklee@hotmail.com', displayName: 'Vincent Zhang', pwdState: 0};
      return done(null, loginUser);
    } else {
      const failedMsg = message.reportShortText('LOGON', 'USER_PASSWORD_WRONG', 'E');
      return done(null, null, failedMsg);
    }
  }),);

passport.serializeUser(function (loginUser, done) {
  //TODO: Serialize authorizations into login session
  done(null, loginUser);
},);
passport.deserializeUser(function (loginUser, done) {
  // if(loginUser.USER_ID && loginUser.userProfile)
  //   loginUser.Authorization = new Authorization(loginUser.USER_ID, loginUser.userProfile);
  done(null, loginUser);
},);

module.exports = {
  logon: function (req, res, next) {
    passport.authenticate('local', function(err, user, msg){
      if(err) return next(err); //Un-catchable system error

      if(msg)return res.json(msg); //Response logon error message

      if(user){
        req.logIn(user, function(err) {
          if (err) return next(err);
          res.json(user);  //Response the user
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

