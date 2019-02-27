const Router = require('./server/router');
const AuthCtrl = require('./server/controller/auth_ctrl');
const Authentication = require('./server/Authentication');

module.exports = {
  Router: Router,
  AuthCtrl: AuthCtrl,
  Authentication: Authentication
};
