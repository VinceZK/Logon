/**
 * Created by VinceZK on 5/27/18.
 */
const passport =  require('passport');
const LocalStrategy = require('passport-local').Strategy;
export { authentication };

function authentication() {

}
authentication.logon = function(req, res, next) {

};

authentication.logout = function(req, res) {

};

authentication.LocalStrategy =  new LocalStrategy(
  function(username, password, done){
    user.getUserByEmail(username, function(msg, loginUser){
      if(msg.msgType === 'E'){
        return done(null, false, {message: '',
          errorEmail: msg.msgText,
          errorPassword:''});
      }

      if(loginUser.PASSWORD === password){
        //TODO: Roll-in authorizations
        var _rawProfile = JSON.parse(fs.readFileSync('./example/testProfile01', 'utf8'));
        loginUser.userProfile = compileProfile(_rawProfile);

        if(loginUser.PWD_STATE === '0') {//Password is initial,and need to reset!
          return done(null,  loginUser, {message: 'renewPWD',
            errorEmail:'',
            errorPassword:''});
        }else{//Password is valid
          return done(null,  loginUser, {message: 'Success',
            errorEmail:'',
            errorPassword:''});
        }
      }else{
        return done(null,  false, { message: '',
          errorEmail: '',
          errorPassword:'Incorrect password!'});
      }
    })
  });
