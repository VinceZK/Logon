const express = require('express');
const session = require('express-session');
const redisStore = require('connect-redis')(session);
const passport = require('passport');
const compress = require('compression');
const path = require('path');

const app = express();

// Static stuff before session is initialized
app.use(express.static(path.join(__dirname, 'dist/Logon')));

app.use(session({
  name: 'sessionID',
  secret:'darkhouse',
  saveUninitialized: false,
  store: new redisStore(),
  unset: 'destroy', //Only for Redis session store
  resave: false,
  cookie: {httpOnly: false, maxAge: 15 * 60 * 1000 }
}));
app.use(require('cookie-parser')());
app.use(require('body-parser').json());
app.use(passport.initialize());
app.use(passport.session());
app.use(compress());


// Routing
const routes = require('./server/server_routes');
app.use('/', routes);

app.set('port', process.env.PORT || 3000);

process.on('SIGINT',function(){
  console.log("Closing.....");
  process.exit()
});

app.listen(app.get('port'), () => console.log('Example app listening on port 3000!'));
