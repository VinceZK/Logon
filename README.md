# UI-Logon

An identification management solution implemented using using Angular, Express, Passport, node-authorization, and JSON-On-Relations. 
It contains following components:
+ Logon Module
![Logon Page](logon.png)
+ User Management
+ Permission Management
+ Define Profile
+ Define App
+ Define App Category 
+ Define Authorization Object

## How to Use
UI-Logon contains 3 parts: 

1. "ui-logon-angular" is an Angular reusable component. You can use it to compose your logon page. 
2. "Identification Management" contains various Apps which are used to maintain identification objects. 
You can use these Apps to easily maintain users, permissions, profiles, authorization objects, and so on. 
3. "ui-logon" is a NodeJS component which contains backend routes, authentication, and authorization logic. 

You can leverage the 3 parts separately or in combinations.

### UI-Logon-Angular
1. Install it to your angular project:
   ```bash
    $ npm install ui-logon-angular --save
   ```
2. In "app.module.ts", import the "LogonModule" from "ui-logon-angular":
   ```typescript
   import {LogonModule} from 'ui-logon-angular';

   @NgModule({
     declarations: [
       AppComponent
     ],
     imports: [
       BrowserModule,
       LogonModule
     ],
     providers: [],
     bootstrap: [AppComponent]
   })
   export class AppModule { } 
   ```
3. In "app.component.html", add the "dk-logon" template:
   ```html
   <dk-logon [redirectUrl]="'https://github.com/VinceZK/json-on-relations'"></dk-logon>
   ```
4. Run your Angular project.   

### Identification Apps

### The NodeJS Side
The "ui-logon" server side is implemented in NodeJS, together with 
[ExpressJS](https://expressjs.com), 
[PassportJS](http://www.passportjs.org/), 
[node-authorization](https://github.com/VinceZK/authorization), 
[JSON-On-Relations](https://github.com/VinceZK/json-on-relations) and other relative components.

Ui-logon uses redis as the session store for PassportJS. So you have to install the redis server. 
Please refer the [quick guide](https://redis.io/topics/quickstart) for how to install redis.

JSON-On-Relations depends on mysql. Please refer the [How-to-use](https://github.com/VinceZK/json-on-relations)
on JSON-On-Relations, and install mysql as well.

After get the above prerequisite done. You can now follow the steps bellow to setup the server:
1. Install it to your node project:
   ```bash
   $ npm install ui-logon --save
   ```
2. Create a "server.js" file in the root of your Node project:
   ```javascript 1.8
   // Create a expressjs app
   const express = require('express');
   const app = express();
   
   // Register your Angular built files as static
   const path = require('path');
   app.use(express.static(path.join(__dirname, 'dist/LogonApp')));
   app.get('/logon', (req, res) => { // Open the logon page
     res.sendFile(path.join(__dirname, 'dist/LogonApp/index.html'));
   });

   // Register express-session middle ware with redis
   const session = require('express-session');
   const redisStore = require('connect-redis')(session);
   app.use(session({
     name: 'sessionID',
     secret:'darkhouse',
     saveUninitialized: false,
     store: new redisStore(),
     unset: 'destroy', 
     resave: false,
     cookie: {httpOnly: false, maxAge: 15 * 60 * 1000 }
   }));
   
   // Allow cross site requests and parse json 
   app.use(require('cors')()); 
   app.use(require('body-parser').json());

   // Register passport for authentication
   const passport = require('passport');
   app.use(passport.initialize());
   app.use(passport.session());
   
   // Get the default router
   const router = require('ui-logon').Router;
   const jor = require('json-on-relations');
   router.use(jor.Routes); // JOR Routes
   router.get('*', (req, res) => { // The default index.html
     res.sendFile(path.join(__dirname, 'dist/LogonApp/index.html'));
   });
   app.use('/', router);
   
   // Load the authentication logic with JSON-On-Relations
   require('ui-logon').Authentication(jor);
   
   // Bootstrap the server
   app.set('port', process.env.PORT || 3000);
   jor.EntityDB.executeSQL('select ENTITY_ID from ENTITY', function (err, rows) {
     if (err) debug("bootstrap: get entities==> %s", err);
     else {
       const entities = [];
       rows.forEach(row => entities.push(row.ENTITY_ID));
       jor.EntityDB.loadEntities(entities, function (err) {
         if (err) debug("bootstrap: load entities==> %s", err);
         else
           app.listen(app.get('port'), () => console.log('Example app listening on port 3000!'));
       })
     }
   });
   ```
3. Now you can start the node server and test the logon page:      
   ```bash
   $ node server.js
   ```
   Test with the link: <http://localhost:3000>

## Customization
Of course, you are allowed to do some customizations to make it fit your requirements. 

### Change the Labels
The title and labels in the UI component can be changed. You can either do it in this way:
```html
<dk-logon [title]="My Logon Dialog" [userLabel]="Email" [pwdLabel]="Password" [btnLabel]="Sign In" 
          [redirectUrl]="'http://your-landing-page'">
</dk-logon>
``` 
Or use the navigation data attribute:
```typescript
const appRoutes: Routes = [
  { path: 'landing', component: LandingPageComponent },
  {
    path: 'logon', component: LogonComponent,
    data: {
      title: 'Logon Portal', userLabel: 'User ID', pwdLabel: 'Password', btnLabel: 'Sign In',
      redirectPath: 'landing', redirectUrl: ''
    }
  },
  { path: '**', redirectTo: 'logon', pathMatch: 'full'}
];
```
You can find another difference of the above 2 approaches. The second one uses Angular Route to do the redirection.
Thus you use attribute "redirectPath" instead of "redirectUrl", which will redirect to a Angular component.

### Define Logon Strategy
PassportJS already provides a flexible way to let use different authentication strategies. 
Since we mainly use the basic user&password strategy, so just register a LocalStrategy is enough.
The default implementation is given bellow:
```javascript 1.8
    const entity = jor.Entity;
    passport.use(new LocalStrategy(
      function (username, password, done) {
        entity.getInstancePieceByID(
          {RELATION_ID: 'r_user', USER_ID: username}, {RELATIONS: ['r_user']}, 
          function (err, data) {
            if (err) return done(err);
      
            if (data['ENTITY_ID']){
              let identity = {};
              let user = data['r_user'][0];
              if (user['PASSWORD'] === password) {
                delete user['PASSWORD'];
                identity['userBasic'] = user;
                identity['profile'] =
                  compileProfile(JSON.parse(fs.readFileSync(path.join(__dirname, '../data/authProfile.json'), 'utf8')));
                return done(null, identity);
              } else {
                return done(message.reportShortText('LOGON', 'USER_PASSWORD_WRONG', 'E'));
              }
            } else {
              return done(message.reportShortText('LOGON', 'USER_PASSWORD_WRONG', 'E'));
            }
        });
      }));
```
It uses JSON-On-Relations(jor.Entity) to retrieve user information from the database. 
The function "getInstancePieceByID" is called to ask for the information from relation "r_user" 
with USER_ID equals to the requested username. Please refer <https://github.com/VinceZK/json-on-relations> for the API details.

After the user information is retrieved, it compares the password values. 
If they are equal, then attach the user information to the "identity" object. 
Besides the basic user information, the "identity" is also attached to authorization information 
utilized by [node-authorization](https://github.com/VinceZK/authorization). 

You can write your own logon logic, and register it with "passport.use()" function, which will overwrite the default.
 
### The Default Routes
The default router is already registered with following routes. 
You can further append your routes to it. 
However, these routes will be protected by "Auth.ensureAuthenticated" 
if it starts with '/api/' to prohibit the unauthorized accesses.
```javascript 1.8
// Basic login with username & password
router.post('/api/logon', Auth.logon);
router.delete('/api/logout', Auth.logout);

// Ensure all the APIs bellow are under authentication.
router.all('/api/*', Auth.ensureAuthenticated);

// Identity APIs
router.get('/api/session', Auth.session);
router.post('/api/renewPWD',Auth.renewPWD);

module.exports = router;
``` 

## License
[The MIT License](http://opensource.org/licenses/MIT)
