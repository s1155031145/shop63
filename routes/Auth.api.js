var express = require('express'),
exphbs = require('express-secure-handlebars'),
mysql = require('mysql'),
config = require('../shop63-ierg4210.config.js'),
connectionpool = mysql.createPool(config),
bodyParser = require('body-parser'),
cookieParser = require('cookie-parser'),
session = require('express-session'), 
RedisStore = require('connect-redis')(session),
expressValidator = require('express-validator'),
csrf = require('csurf');
// Reference: https://github.com/expressjs/session

var crypto = require('crypto');
function hmacPassword (password, salt) 
{
var hmac = crypto.createHmac('sha256', salt);
//console.log(salt); // zhu
hmac.update(password);
return hmac.digest('base64');
}
//console.log(hmacPassword(ÈVÈZ123456'));

var csrfProtection = csrf({ cookie: true })

var app = express.Router();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public/'));
app.use(expressValidator());

app.use(cookieParser()); 
app.use(session({ 
 store: new RedisStore({ 
// 'host':'ierg4210.oxmzfj.0001.apse1.cache.amazonaws.com', 'port':6379}),
 'host':'127.0.0.1', 'port':6379}),
 name: 'shop63-admin',
 secret: '7mA2dHdjNWJqNEteutDAX9Ud', // by random.org
 resave: false, 
 saveUninitialized: false, 
 cookie: { path: '/admin', maxAge: 1000*60*60*24*3, 
httpOnly: true } // expiring in 60s 
})); 

//app.use(csrf({ cookie: true }))
// error handler 
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)
 
  // handle CSRF token errors here 
  res.status(403)
  res.send('form tampered with')
})

//console.log('login:A');

app.get('/login', csrfProtection, function (req, res) {
	// TODO: render login page
	//console.log('login:B');
	req.session.destroy();
	res.render('admin/login', { csrfToken: req.csrfToken() });
});

app.get('/logout', function (req, res) {
	// TODO: render login page
	//console.log('login:B');
	req.session.destroy();
	res.redirect('admin/login');
});

app.post('/api/login', function (req, res) {
  //console.log('login:C');
  req.checkBody('username', 'Invalid Username').isLength(4, 512).isEmail();
  req.checkBody('password', 'Invalid Password').isLength(6, 512).matches('^[\x20-\x7E]{6,512}$');
	if (req.validationErrors()) {
	return res.status(400).json({'Invalid Input': req.validationErrors()}).end();
	}
  connectionpool.getConnection(function(err, connection) {
  if (err) {
      console.error('CONNECTION error: ',err);
      res.statusCode = 503;
      res.send({
          result: 'error',
          err:    err.code
      });
  } else {
	connection.query('SELECT * FROM users WHERE username = ? LIMIT 1',
					 [req.body.username],function (error, result) {
		if (error) {
			console.error(error);
			return res.status(500).json({'dbError': 'check server log'}).end();
		}
		//console.log(result);
		if (result[0] === undefined){
			return res.status(400).json({'loginError': 'Wrong username or password'}).end();
		}
		var submitedSaltedPassword = hmacPassword(req.body.password,result[0].salt);
		//console.log(submitedSaltedPassword); //I made a mistake here and this is how to debug
		//console.log(result.rows[0].saltedPassword); // Output in the right position.
		// Didn't pass the credential.
		if (result.rowCount === 0 || result[0].saltedPassword != submitedSaltedPassword) {
			return res.status(400).json({'loginError': 'Wrong username or password'}).end();
		}
		console.log('login success');
			//The purpose for these parts of codes would be covered later.
			req.session.username = req.body.username; 
			req.session.admin = result[0].admin;
			//res.status(200).json({'loginOK': 1}).end();
		res.redirect('/admin');

	});
  }
 });
});

app.use('/', function (req, res, next) {
	//console.log('login:D');
	// TODO: if OK, then next route (admin)
	// otherwise back to the login page
	if (req.session && req.session.admin)
		return next();
	return req.xhr ? res.status(400).json({'loginError': 'Session Expired'}).end() : res.redirect('/admin/login');
});

module.exports = app;