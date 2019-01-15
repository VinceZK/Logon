const router = require('express').Router();
const Auth = require('./controller/auth_ctrl.js');

// Basic login with username & password
router.post('/api/logon', Auth.logon);
router.delete('/api/logout', Auth.logout);

// Ensure all the APIs bellow are under authentication.
router.all('/api/*', Auth.ensureAuthenticated);

// Identity APIs
router.get('/api/session', Auth.session);
router.post('/api/renewPWD',Auth.renewPWD);

module.exports = router;
