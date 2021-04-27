const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const Authorization = require('node-authorization').Authorization;
const compileProfile = require('node-authorization').profileCompiler;
const Message = require('ui-message').Message;
const MsgFileStore = require('ui-message').MsgFileStore;
const msgStore = new MsgFileStore(path.join(__dirname, '../data/message.json'));
const message = new Message(msgStore, 'EN');

module.exports = {
  Authorization: Authorization,
  Authentication: function (jor) {
    const entity = jor.Entity;
    /**
     * Implement the local strategy by accessing the MDB
     */
    passport.use(new LocalStrategy(
      function (username, password, done) {
        const pieceObject = {
          RELATIONS: ['r_user', 'r_personalization'],
          RELATIONSHIPS: [
            {
              RELATIONSHIP_ID: 'rs_user_role',
              PARTNER_ENTITY_PIECES: {
                RELATIONS: ['r_role'],
                RELATIONSHIPS: [
                  {
                    RELATIONSHIP_ID: 'rs_role_category_profile',
                    PARTNER_ENTITY_PIECES: [
                      {
                        ENTITY_ID: 'authProfile',
                        piece: { RELATIONSHIPS: ['rs_auth_profile_object'] }
                      }]
                  }
                ]
              }
            }]
        };
        entity.getInstancePieceByID({ RELATION_ID: 'r_user', USER_ID: username},
          pieceObject,function (err, data) {
            if (err) return done(err);
            if (data['ENTITY_ID']){
              let identity = {};
              let user = data['r_user'][0];
              if (user['PASSWORD'] === password) {
                delete user['PASSWORD'];
                identity['userBasic'] = user;
                let personalization = data['r_personalization'] ? data['r_personalization'][0] : null;
                if (personalization) {
                  identity['userBasic']['DATE_FORMAT'] = personalization['DATE_FORMAT'];
                  identity['userBasic']['DECIMAL_FORMAT'] = personalization['DECIMAL_FORMAT'];
                  identity['userBasic']['TIMEZONE'] = personalization['TIMEZONE'];
                  identity['userBasic']['LANGUAGE'] = personalization['LANGUAGE'];
                }
                const rsUserRole = data['relationships'] && data['relationships'][0] ? data['relationships'][0] : null;
                if (!rsUserRole) {
                  identity['profile'] = [];
                  return done(null, identity);
                }
                const rawProfiles = [];
                rsUserRole.values.forEach( role => {
                  const rsRoleCategoryProfile = role.PARTNER_INSTANCES[0]['relationships'][0];
                  rsRoleCategoryProfile.values.forEach( profile => {
                    const rawProfile = [];
                    const rsProfileObject =
                      profile.PARTNER_INSTANCES.find(partner => partner.ENTITY_ID === 'authProfile').relationships;
                    if (rsProfileObject.length === 1 ) {
                      rsProfileObject[0].values.forEach( authorization => rawProfile.push(JSON.parse(authorization['AUTH_VALUE'])));
                      rawProfiles.push(rawProfile);
                    }
                  })
                });
                identity['profile'] = compileProfile(rawProfiles);
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

  }
};





