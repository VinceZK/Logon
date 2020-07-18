const Router = require('./server/router');
const AuthCtrl = require('./server/controller/auth_ctrl');
const Identification = require('./server/identification');

module.exports = {
  Router: Router,
  AuthCtrl: AuthCtrl,
  Identification: Identification
};
