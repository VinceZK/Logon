const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

const app = express();

app.use(session({
  name: 'sessionID',
  secret:'darkhouse',
  saveUninitialized: false,
  resave: false,
  cookie: {httpOnly: false }
}));
app.use(require('cookie-parser')());
app.use(require('body-parser').json());
app.use(passport.initialize());
app.use(passport.session());

// Routing
const routes = require('./server/server_routes');
app.use('/', routes);

// angular启动页
app.use(express.static(path.join(__dirname, 'dist/Logon')));

app.set('port', process.env.PORT || 3000);

process.on('SIGINT',function(){
  console.log("Closing.....");
  process.exit()
});

app.listen(app.get('port'), () => console.log('Example app listening on port 3000!'));
