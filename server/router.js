const router = require('express').Router();
const Auth = require('./controller/auth_ctrl.js');
const path = require('path');

router.get('/logon', (req, res) => { // Open the index.html
  res.sendFile(path.join(__dirname, '../dist/LogonApp/index.html'));
});

// Basic login API with username & password
router.post('/api/logon', Auth.logon);
router.delete('/api/logout', Auth.logout);
router.get('/api/checkAuthenticated', Auth.checkAuthenticated);

// Ensure all the requests bellow are under authentication.
router.all('*', Auth.ensureAuthenticated);

// Identity APIs
router.get('/api/session', Auth.session);
router.post('/api/renewPWD',Auth.renewPWD);

module.exports = router;
