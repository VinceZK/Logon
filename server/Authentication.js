const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const Authorization = require('node-authorization').Authorization;
const compileProfile = require('node-authorization').profileCompiler;
const fs = require('fs');
const Message = require('ui-message').Message;
const MsgFileStore = require('ui-message').MsgFileStore;
const msgStore = new MsgFileStore(path.join(__dirname, '../data/message.json'));
const message = new Message(msgStore, 'EN');

module.exports = function (jor) {
  const entity = jor.Entity;
  /**
   * Implement the local strategy by accessing the MDB
   */
  passport.use(new LocalStrategy(
    function (username, password, done) {
      entity.getInstancePieceByID({RELATION_ID: 'r_user', USER_ID: username}, {RELATIONS: ['r_user']}, function (err, data) {
        if (err) return done(err);

        if (data['ENTITY_ID']){
          let identity = {};
          let user = data['r_user'][0];
          if (user['PASSWORD'] === password) {
            delete user['PASSWORD'];
            identity['userBasic'] = user;
            identity['profile'] =
              compileProfile(JSON.parse(fs.readFileSync(path.join(__dirname, '../data/authProfile.json'), 'utf8')));
            return done(null, identity);
          } else {
            return done(message.reportShortText('LOGON', 'USER_PASSWORD_WRONG', 'E'));
          }
        } else {
          return done(message.reportShortText('LOGON', 'USER_PASSWORD_WRONG', 'E'));
        }
      });
    }));
  /**
   * Cache all the identity information to Redis session store
   * This method is only called after successfully login
   */
  passport.serializeUser(function (identity, done) {
    done(null, identity);
  });

  /**
   * Express Session helps to get identity from Redis session store
   * and pass to this method for *EVERY* request (should exclude static files).
   * Here, we pass the identity together with Authorization object to req.user.
   * We should not change the identity object as it will reflect to req.session.passport.user,
   * which afterwards will be saved back to Redis session store for every HTTP response.
   */
  passport.deserializeUser(function (identity, done) {
    const user = {
      identity: identity,
      Authorization: null
    };

    if(identity.userBasic && identity.userBasic.USER_ID && identity.profile)
      user.Authorization = new Authorization(identity.userBasic.USER_ID, identity.profile);

    done(null, user); // be assigned to req.user
  });
};



