const express = require('express');
const router = express.Router();
const Auth = require('./controller/server_auth_ctrl.js');
const path = require('path');

// Basic login with username & password
router.post('/api/login',Auth.logon);
router.delete('/api/login',Auth.logout);

// Ensure all the APIs bellow are under authentication.
router.all('/api/*', Auth.ensureAuthenticated);
// Identity APIs.
router.get('/api/login',Auth.session);
router.post('/api/renewPWD',Auth.renewPWD);

// angular启动页
router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/Logon/index.html'));
});

module.exports = router;
