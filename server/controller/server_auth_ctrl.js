/**
 * Created by VinceZK on 5/27/18.
 */
const passport =  require('passport');
const LocalStrategy = require('passport-local').Strategy;
const Message = require('ui-message').Message;
const MsgFileStore = require('ui-message').MsgFileStore;
const path = require('path');

function authentication() {
  this.msgStore = new MsgFileStore(path.join(__dirname, '/data/message.json'));
  this.message = new Message(this.msgStore, 'EN');
}

authentication.logon = function(req, res, next) {
  passport.authenticate('local', { failureMessage: true})(req, res, next);
};

authentication.logout = function(req, res) {
  if(req.user){
    req.logout();
    res.status(200).end();
  }else{
    res.status(400).send('Not Logged in');
  }
};

authentication.renewPWD = function(req, res) {

};

authentication.LocalStrategy =  new LocalStrategy(
  function(username, password, done){
    if(username === 'zklee@hotmail.com' && password === 'Dark1234'){
      const loginUser = { id: 'VinceZK', email: 'zklee@hotmail.com', displayName: 'Vincent Zhang', pwdState: 0};
      done(null, loginUser);
    }else{
      const failedMsg = this.message.reportShortText('LOGON','USERNAME_PASSWORD_WRONG', 'E');
      done(null, null, failedMsg);
    }
  });

authentication.serializeUser = function(loginUser, done) {
  //TODO: Serialize authorizations into login session
  done(null, loginUser);
};

authentication.deserializeUser = function(loginUser, done) {
  // if(loginUser.USER_ID && loginUser.userProfile)
  //   loginUser.Authorization = new Authorization(loginUser.USER_ID, loginUser.userProfile);
  done(null,  loginUser);
};

authentication.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  }else{
    res.status(401).send('Unauthenticated!');
  }
};

authentication.session = function(req, res){
  if(req.user){
    res.json(req.user);
  }
  else{
    res.status(200).end();
  }
};

module.exports = authentication;
