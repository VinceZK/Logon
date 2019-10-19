const debug = require('debug')('Logon: bootstrap');
const express = require('express');
const app = express();

// Static stuff before session is initialized
const path = require('path');
app.use(express.static(path.join(__dirname, 'dist/LogonApp')));
app.get('/logon', (req, res) => { // Open the logon page
  res.sendFile(path.join(__dirname, 'dist/LogonApp/index.html'));
});

// Register involved middleware
const session = require('express-session');
const redisStore = require('connect-redis')(session);
app.use(session({
  name: 'sessionID',
  secret:'darkhouse',
  saveUninitialized: false,
  store: new redisStore(), // Start ./redis-server in ~/workspace/redis-4.0.9/src/
  unset: 'destroy', //Only for Redis session store
  resave: false,
  cookie: {httpOnly: false, maxAge: 15 * 60 * 1000 }
}));

app.use(require('cors')()); // Allow cross site requests
app.use(require('body-parser').json());
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());
app.use(require('compression')());

// Routing
const jor = require('json-on-relations');
const router = require('./server/router');
router.use(jor.Routes); // JOR APIs
router.get('*', (req, res) => { // Ensure refreshing into index.html
  res.sendFile(path.join(__dirname, 'dist/LogonApp/index.html'));
});
app.use('/', router);

// Load Authentication
require('./server/Authentication')(jor);
require('./server/controller/permission_ctrl');

// Set the port and bootstrap
app.set('port', process.env.PORT || 3000);
process.on('SIGINT',function(){
  console.log("Closing.....");
  process.exit()
});
app.listen(app.get('port'), () => console.log('Example app listening on port 3000!'));



