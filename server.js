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
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'dist/Logon')));


// Send all other requests to the Angular app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/Logon/index.html'));
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));
