/**
 * Created by VinceZK on 5/27/18.
 */
const passport = require('passport');

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
          data.user = user.userBasic;
          res.json(data);  // Response the user
        });
      }
    })(req, res, next);
  },

  logout: function (req, res) {
    if (req.user) {
      req.logout();
      req.session = null; // To forbid the session recreation
      res.status(200).end();
    } else {
      res.status(400).send('Not Logged in');
    }
  },

  checkAuthenticated: function (req, res) {
    res.json(req.isAuthenticated()? 'authenticated': 'unauthenticated');
  },

  ensureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      next(); //Continue
    } else {
      if (req.url.includes('/api/')) {
        res.status(401).send('Unauthenticated!');
      } else {
        res.redirect(301, '../logon');
      }
    }
  },

  session:function(req,res){
    if(req.user){
      res.json(req.user.identity.userBasic);
    } else {
      res.status(200).end();
    }
  },

  renewPWD: function (req, res) {

  },
};

