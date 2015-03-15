var express = require('express'),
exphbs = require('express3-handlebars'),
mysql = require('mysql'),
config = require('../shop63-ierg4210.config.js'),
connectionpool = mysql.createPool(config),
bodyParser = require('body-parser'),
cookieParser = require('cookie-parser'),
session = require('express-session'), 
RedisStore = require('connect-redis')(session);
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

var app = express.Router();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public/'));

app.use(cookieParser()); 
app.use(session({ 
 name: 'shop63-admin',
 secret: '7mA2dHdjNWJqNEteutDAX9Ud', // by random.org
 resave: false, 
 saveUninitialized: false, 
 cookie: { path: '/admin', maxAge: 1000*60*60*24*3, 
httpOnly: true } // expiring in 60s 
})); 

//console.log('login:A');

app.get('/login', function (req, res) {
	// TODO: render login page
	//console.log('login:B');
	req.session.destroy();
	res.render('admin/login');
});

app.get('/logout', function (req, res) {
	// TODO: render login page
	//console.log('login:B');
	req.session.destroy();
	res.redirect('admin/login');
});

app.post('/api/login', function (req, res) {
  //console.log('login:C');
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
			return req.xhr ? res.status(400).json({'loginError': 'Wrong username or password'}).end() : res.redirect('/admin/login');
		}
		var submitedSaltedPassword = hmacPassword(req.body.password,result[0].salt);
		//console.log(submitedSaltedPassword); //I made a mistake here and this is how to debug
		//console.log(result.rows[0].saltedPassword); // Output in the right position.
		// Didn't pass the credential.
		if (result.rowCount === 0 || result[0].saltedPassword != submitedSaltedPassword) {
			return req.xhr ? res.status(400).json({'loginError': 'Wrong username or password'}).end() : res.redirect('/admin/login');
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