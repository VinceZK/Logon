const express = require('express');
const router = express.Router();
const Auth = require('./controller/server_auth_ctrl.js');

// Basic login with username & password
router.post('/api/logon',Auth.logon);
router.post('/api/logout',Auth.logout);

// Ensure all the APIs bellow are under authentication.
router.all('/api/*', Auth.ensureAuthenticated);
// Identity APIs.
router.post('/api/renewPWD',Auth.renewPWD);

module.exports = router;
