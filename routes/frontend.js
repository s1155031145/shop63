var express = require('express'),
exphbs = require('express-secure-handlebars'),
mysql = require('mysql'),
config = require('../shop63-ierg4210.config.js'),
connectionpool = mysql.createPool(config),
bodyParser = require('body-parser'),
done=false,
expressValidator = require('express-validator'),
cookieParser = require('cookie-parser'),
session = require('express-session'), 
RedisStore = require('connect-redis')(session),
csrf = require('csurf'),
paypal = require('paypal-rest-sdk');

// load aws sdk
var aws = require('aws-sdk');

// load aws config
aws.config.loadFromPath('shop63-ierg4210-ses.config.json');

// load AWS SES
var ses = new aws.SES({apiVersion: '2010-12-01'});

var app = express.Router();

paypal.configure({
	'mode': 'sandbox',
	'client_id': 'AcKefZr4cT_B9hDKL8Xzsbjf2pVuMa2KBXjDqH8pGF0FF-OLindjYmN1AWsJwW0Dd8iUDRQ9pzSCoi9Z',
	'client_secret': 'EHqSqJq12Zr0LNP3osMBZkAeGvQyBALvDemVswXp6AD1MSw9O0F0HotxPRXFVgvkZqJVpKFmrZfaQZnI'
});

var create_payment_json = {
	"intent": "sale",
	"payer": {
		"payment_method": "paypal"
	},
	"redirect_urls":{
		//"return_url": "http://localhost:8888/checkout/thankyou",
		//"cancel_url": "http://localhost:8888/checkout/error"
		"return_url": "https://store63.ierg4210.org/checkout/thankyou",
		"cancel_url": "https://store63.ierg4210.org/checkout/error"
	},
	"transactions": [{
		"item_list": {
			"items": []
		},
		"amount": {
			"currency": "USD",
			"total": "0"
		},
		"description": "IERG4210 Shop63"
	}]
};

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public/'));
app.use('/account', express.static('public/'));
app.use(expressValidator());

app.use(cookieParser()); 
app.use(session({ 
 store: new RedisStore({ 
 'host':'ierg4210.oxmzfj.0001.apse1.cache.amazonaws.com', 'port':6379}),
// 'host':'127.0.0.1', 'port':6379}),
 name: 'account',
 secret: '7mA2dHdjNWJqNEteutDAX9Ud', // by random.org
 resave: false, 
 saveUninitialized: false, 
 cookie: { path: '/', maxAge: 1000*60*60*2, 
httpOnly: true 
//, secure: true
} 
})); 

var crypto = require('crypto');
function hmacPassword (password, salt) 
{
var hmac = crypto.createHmac('sha256', salt);
//console.log(salt); // zhu
hmac.update(password);
return hmac.digest('base64');
}
//console.log(hmacPassword(бе123456'));

app.use(csrf({ cookie: {httpOnly: true, secure: true 
} }));
// error handler 
app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err)
 
  // handle CSRF token errors here 
  res.status(403)
  res.send('form tampered with')
});

app.get('/', function (req, res) {
  req.checkQuery('catid', 'Invalid catid').optional().isInt();
  req.sanitize('catid').toInt();
	if (req.validationErrors()) {
	return res.status(400).json({'Invalid Input': req.validationErrors()}).end();
	}
  var catid = req.query.catid;
  var bar;
  if (req.session && req.session.username != undefined)
	bar = [{url: "/account", action: "Account"}, {url: "/account/logout", action: "Logout"}];
  else
	bar = [{url: "/account/login", action: "Login"}];
  //console.log(bar);
  connectionpool.getConnection(function(err, connection) {
  if (err) {
      console.error('CONNECTION error: ',err);
      res.statusCode = 503;
      res.send({
          result: 'error',
          err:    err.code
      });
  } else {
    connection.query('select * from categories', function(err, rows) {
    if (err) {
        console.error(err);
        res.statusCode = 500;
        res.send({
            result: 'error',
            err:    err.code
        });
    } else {
	  if (!(catid === undefined || catid == '')){
		connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ',err);
			res.statusCode = 503;
			res.send({
				result: 'error',
				err:    err.code
			});
		} else {
			connection.query('select c.catid, c.name AS cat_name, pid, p.name AS pro_name, price, description from categories AS c LEFT JOIN products AS p ON c.catid = p.catid where c.catid = ? ', [catid], function(err2, result) {
				if (err2) {
					console.error(err2);
					res.statusCode = 500;
					res.send({
						result: 'error',
						err:    err2.code
					});
				} else {
					console.log('csrf: '+req.csrfToken());
					res.render('home', { title: 'Home', "bar": bar, categories: rows, products: result, category: result[0].cat_name, csrfToken: req.csrfToken()});
				}
				connection.release();
		    });
		}
		});
	  } else {
		res.render('home', { title: 'Home', "bar": bar, categories: rows, csrfToken: req.csrfToken()});
	  }
    }
    connection.release();
   });
  }
 });
});

app.get('/product', function (req, res) {
  req.checkQuery('pid', 'Invalid catid').notEmpty().isInt();
  req.sanitize('pid').toInt();
	if (req.validationErrors()) {
	return res.status(400).json({'Invalid Input': req.validationErrors()}).end();
	}
  var pid = req.query.pid;
  var bar;
  if (req.session && req.session.username != undefined)
	bar = [{url: "/account", action: "Account"}, {url: "/account/logout", action: "Logout"}];
  else
	bar = [{url: "/account/login", action: "Login"}];
  //console.log('pid:'+pid);
  connectionpool.getConnection(function(err, connection) {
  if (err) {
      console.error('CONNECTION error: ',err);
      res.statusCode = 503;
      res.send({
          result: 'error',
          err:    err.code
      });
  } else {
    connection.query('select * from categories', function(err, rows) {
    if (err) {
        console.error(err);
        res.statusCode = 500;
        res.send({
            result: 'error',
            err:    err.code
        });
    } else {
	  if (!(pid === undefined || pid == '')){
		connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ',err);
			res.statusCode = 503;
			res.send({
				result: 'error',
				err:    err.code
			});
		} else {
			//console.log('select p.catid, c.name AS cat_name, pid, p.name AS pro_name, price, description from products as p left join categories as c on p.catid = c.catid where p.pid =\'' + pid + '\'');
			connection.query('select p.catid, c.name AS cat_name, pid, p.name AS pro_name, price, description from products as p left join categories as c on p.catid = c.catid where p.pid = ? ', [pid], function(err2, result) {
				if (err2) {
					console.error(err2);
					res.statusCode = 500;
					res.send({
						result: 'error',
						err:    err2.code
					});
				} else {
					console.log(result);
					res.render('product', { title: 'Product', "bar": bar, categories: rows, product: result, csrfToken: req.csrfToken()});
				}
				connection.release();
		    });
		}
		});
	  } else {
		res.render('product', { title: 'Product', "bar": bar, categories: rows, csrfToken: req.csrfToken()});
	  }
    }
    connection.release();
   });
  }
 });
});

app.get('/getShopList', function (req, res) {
  var list = JSON.parse(req.query.list),
  strSQL = 'select pid, name, price from products where ',
  json_shop_list = {
	"total":"0"
  };
  for (var i = 0; i < list.shop_list.length; i++){
	  if (!(list.shop_list[i].pid == parseInt(list.shop_list[i].pid)) || !(list.shop_list[i].quantity == parseInt(list.shop_list[i].quantity))){
		return res.status(400).end('Invalid Input');
	  }
  }
  if (list != null){
	  if (list.shop_list.length > 0){
		  for (var i = 0; i < list.shop_list.length; i++){
			if (i == (list.shop_list.length - 1))
				strSQL += 'pid = \''+list.shop_list[i].pid+'\' ';
			else
				strSQL += 'pid = \''+list.shop_list[i].pid+'\' or ';
		  }
		  console.log(strSQL);
		  connectionpool.getConnection(function(err, connection) {
		  if (err) {
			  console.error('CONNECTION error: ',err);
			  res.statusCode = 503;
			  res.send({
				  result: 'error',
				  err:    err.code
			  });
		  } else {
			connection.query(strSQL, function(err, rows) {
			if (err) {
				console.error(err);
				res.statusCode = 500;
				res.send({
					result: 'error',
					err:    err.code
				});
			} else {
				console.log(rows);
				json_shop_list.shop_list = rows;
				for (var i = 0; i < list.shop_list.length; i++){
					for (var j = 0; j < json_shop_list.shop_list.length; j++){
						if (list.shop_list[i].pid == json_shop_list.shop_list[j].pid)
							json_shop_list.shop_list[j].quantity = list.shop_list[i].quantity;
					}
				}
				var total = 0;
				for (var i = 0; i < json_shop_list.shop_list.length; i++){	
					total = (+total + (+json_shop_list.shop_list[i].quantity * +json_shop_list.shop_list[i].price)).toFixed(2);
				}
				json_shop_list.total = total;
				console.log(json_shop_list.total);
				res.render('partials/page/shoplist', json_shop_list);
			}
			connection.release();
		   });
		  }
		 });
	  } else {
		res.render('partials/page/shoplist', json_shop_list);
	  }
  } else {
	res.render('partials/page/shoplist', json_shop_list);
  }
});

app.use('/checkout', function(req, res, next){
	if (req.session && req.session.username != undefined){
		return next();	
	}
	console.log(req.query.pid);
	req.session.pid = req.query.pid;
	req.session.pname = req.query.pname;
	req.session.price = req.query.price;
	req.session.quantity =req.query.quantity;
	req.session.total = req.query.total;
	console.log(req.session.pid);
	return res.redirect('/account/login/checkout');
});


app.get('/checkout', function (req, res) {
	var pid = req.query.pid,
	pname = req.query.pname,
	price = req.query.price,
	quantity = req.query.quantity,
	total = req.query.total;
	if (pid == undefined || pname == undefined || price == undefined || quantity == undefined || total == undefined){
		console.log('get from session, pid: '+req.session.pid);
		pid = req.session.pid;
		pname = req.session.pname;
		price = req.session.price;
		quantity = req.session.quantity;
		total = req.session.total;
	}
	
	console.log(pid);
	for (var i = 0; i < pid.length; i++){
		//console.log('pid: '+pid[i]+', pname: '+pname[i]+', price: '+price[i]+', quantity: '+quantity[i]);
		var item = {"name": pname[i],
					"sku": "PID-"+pid[i],
					"price": price[i],
					"currency": "USD",
					"quantity": quantity[i]
					};
		create_payment_json.transactions[0].item_list.items.push(item);
		console.log(create_payment_json.transactions[0].item_list.items);
	}
	create_payment_json.transactions[0].amount.total = total;
	console.log(create_payment_json.transactions[0]);
	
	paypal.payment.create(create_payment_json,
	function(error, payment){
		if (error){
			console.error(error);
		} else {
			console.log("Create Payment Response");
			console.log(payment);
		
			connectionpool.getConnection(function(err, connection) {
				if (err) {
					console.error('CONNECTION error: ',err);
					res.statusCode = 503;
					res.send({
						result: 'error',
						err:    err.code
					});
				} else {
					connection.query('INSERT INTO payments (userid, paymentid, state, dateCreated) VALUES (?,?,?,?)', [req.session.uid, payment.id, payment.state, payment.create_time], function(err, rows) {
						if (err) {
							console.error(err);
							res.statusCode = 500;
							res.send({
								result: 'error',
								err:    err.code
							});
						} else {
						res.render('admin/result', { title: 'Add Categories', result: 'success!'});
						}
						connection.release();
					});
				}
			});
			//update DB INSERT INTO payments (userid, paymentid, state, dateCreated) VALUES ('', payment.id, payment.state, payment.create_time)
			
			var link = payment.links;
			for (var i = 0; i < link.length; i++){
				if (link[i].rel === 'approval_url'){
					res.redirect(link[i].href);
				}
			}
		}
	});
});

app.get('/checkout/thankyou', function (req, res) {
	var paymentId = req.query.paymentId,
	execute_payment_json = {
		"payer_id": req.query.PayerID
	},
	token = req.query.token;
	
	paypal.payment.execute(paymentId, execute_payment_json,
	function (error, payment) {
		if (error) {
			console.log(error.response);
			res.redirect('error').end();
		} else {
			console.log("Get Payment Response");
			console.log(JSON.stringify(payment));
			
			if (payment.state == "approved"){
				console.log("state = " + payment.state);
				
				// update DB
				connectionpool.getConnection(function(err, connection) {
					if (err) {
						console.error('CONNECTION error: ',err);
						res.statusCode = 503;
						res.send({
							result: 'error',
							err:    err.code
						});
					} else {
						connection.query('UPDATE payments SET state = ? WHERE userid = ? AND paymentid = ?', [payment.state, req.session.uid, payment.id], function(err, rows) {
							if (err) {
								console.error(err);
								res.statusCode = 500;
								res.send({
									result: 'error',
									err:    err.code
								});
							} else {
								res.redirect('../finish?paymentId=' + paymentId);
							}
							connection.release();
						});
					}
				});
			} else {
				console.log("state = " + pament.state);
				
				res.redirect('../error?token=' + token);
			}
		}
	});
});

app.get('/finish', function (req, res) {
	var paymentId = req.query.paymentId;
	var bar;
	if (req.session && req.session.username != undefined)
		bar = [{url: "/account", action: "Account"}, {url: "/account/logout", action: "Logout"}];
	else
		bar = [{url: "/account/login", action: "Login"}];
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ',err);
			res.statusCode = 503;
			res.send({
				result: 'error',
				err:    err.code
			});
		} else {
			connection.query('select * from categories', function(err, rows) {
				if (err) {
					console.error(err);
					res.statusCode = 500;
					res.send({
						result: 'error',
						err:    err.code
					});
				} else {
					res.render('finish', { title: 'Finish', "bar": bar, categories: rows, paymentid: paymentId, csrfToken: req.csrfToken()});
				}
				connection.release();
			});
		}
	});
});

app.get('/checkout/error', function (req, res) {
	var token = req.query.token;
	res.redirect('../error?token=' + token);
});

app.get('/error', function (req, res) {
	var token = req.query.token;
	var bar;
	if (req.session && req.session.username != undefined)
		bar = [{url: "/account", action: "Account"}, {url: "/account/logout", action: "Logout"}];
	else
		bar = [{url: "/account/login", action: "Login"}];
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ',err);
			res.statusCode = 503;
			res.send({
				result: 'error',
				err:    err.code
			});
		} else {
			connection.query('select * from categories', function(err, rows) {
				if (err) {
					console.error(err);
					res.statusCode = 500;
					res.send({
						result: 'error',
						err:    err.code
					});
				} else {
					res.render('error', { title: 'Error', "bar": bar,  categories: rows, "token": token, csrfToken: req.csrfToken()});
				}
				connection.release();
			});
		}
	});
});

app.use('/account/login/:action?', function (req, res) {
	// TODO: render login page
	//console.log('login:B');
	//console.log(req.session.pid);
	//req.session.destroy();
	var checkout = req.params.action;
	console.log(checkout);
	if (checkout == 'checkout')
		checkout = '/'+checkout;
	else 
		checkout = '';
	//console.log(req.session.pid);
	res.render('account/login', { "checkout": checkout, csrfToken: req.csrfToken() });
});

app.get('/account/logout', function (req, res) {
	// TODO: render login page
	//console.log('login:B');
	req.session.destroy();
	res.redirect('/');
});

app.post('/account/api/login/:action?', function (req, res) {
  //console.log('login:C');
  var checkout = req.params.action;
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
			req.session.uid = result[0].uid;
			req.session.admin = result[0].admin;
			//res.status(200).json({'loginOK': 1}).end();
		if (checkout == 'checkout')
			res.redirect('/checkout');
		else
			res.redirect('/account');

	});
  }
 });
});

app.get('/account/forgetPW',function(req,res){
	res.render('account/forgetPW', { csrfToken: req.csrfToken() });
});

app.get('/account/finish',function(req,res){
	req.session.destroy();
	var bar = [{url: "/account/login", action: "Login"}];
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ',err);
			res.statusCode = 503;
			res.send({
				result: 'error',
				err:    err.code
			});
		} else {
			connection.query('select * from categories', function(err, rows) {
				if (err) {
					console.error(err);
					res.statusCode = 500;
					res.send({
						result: 'error',
						err:    err.code
					});
				} else {
					res.render('account/finish', { title: 'ChangePW/finish', "bar": bar, categories: rows});
					
				}
			});
			connection.release();
		}
	});
});

app.use('/account',function(req,res,next){
	if (req.session && req.session.username != undefined)
		return next();
	res.redirect('/account/login');
	
});

app.get('/account', function(req,res){
	console.log('enter account');
	var bar = [{url: "/account", action: "Account"}, {url: "/account/logout", action: "Logout"}];
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ',err);
			res.statusCode = 503;
			res.send({
				result: 'error',
				err:    err.code
			});
		} else {
			connection.query('select * from categories', function(err, rows) {
				if (err) {
					console.error(err);
					res.statusCode = 500;
					res.send({
						result: 'error',
						err:    err.code
					});
				} else {
					connection.query('SELECT * FROM payments WHERE userid = ?', [req.session.uid], function(err, results) {
						if (err) {
							console.error(err);
							res.statusCode = 500;
							res.send({
								result: 'error',
								err:    err.code
							});
						} else {
							res.render('account/account', { title: 'Account', "bar": bar, categories: rows, payments: results});
						}
					});
				}
			});
			connection.release();
		}
	});
});

app.get('/account/orderDetail', function(req,res){
	var paymentid = req.query.paymentid;
	var bar = [{url: "/account", action: "Account"}, {url: "/account/logout", action: "Logout"}];
	paypal.payment.get(paymentid, function(error, payment){
		if (error) {
			console.log(error);
			throw error;
		} else {
			console.log('Get Payment Response');
			console.log(JSON.stringify(payment));
			
			
			connectionpool.getConnection(function(err, connection) {
				if (err) {
					console.error('CONNECTION error: ',err);
					res.statusCode = 503;
					res.send({
						result: 'error',
						err:    err.code
					});
				} else {
					connection.query('select * from categories', function(err, rows) {
						if (err) {
							console.error(err);
							res.statusCode = 500;
							res.send({
								result: 'error',
								err:    err.code
							});
						} else {
							res.render('account/orderDetail', { 
								title: 'orderDetail', 
								"bar": bar,
								categories: rows, 
								"paymentid": paymentid,
								total: payment.transactions[0].amount.total,
								items: payment.transactions[0].item_list.items
							});	
						}
					});
					connection.release();
				}
			});
		}
	});
});

app.get('/account/changePW',function(req,res){
	var bar = [{url: "/account", action: "Account"}, {url: "/account/logout", action: "Logout"}];
	connectionpool.getConnection(function(err, connection) {
		if (err) {
			console.error('CONNECTION error: ',err);
			res.statusCode = 503;
			res.send({
				result: 'error',
				err:    err.code
			});
		} else {
			connection.query('select * from categories', function(err, rows) {
				if (err) {
					console.error(err);
					res.statusCode = 500;
					res.send({
						result: 'error',
						err:    err.code
					});
				} else {
					
					res.render('account/changePW', { title: 'ChangePW', "bar": bar, categories: rows, csrfToken: req.csrfToken()});
					
				}
			});
			connection.release();
		}
	});
});

app.post('/account/api/changePW', function(req,res){
  req.checkBody('oldPW', 'Invalid Password').isLength(6, 512).matches('^[\x20-\x7E]{6,512}$');
  req.checkBody('newPW', 'Invalid Password').isLength(6, 512).matches('^[\x20-\x7E]{6,512}$');
  req.checkBody('newPW2', 'Invalid Password').isLength(6, 512).matches('^[\x20-\x7E]{6,512}$');
  if (req.validationErrors()||req.body.newPW!=req.body.newPW2) {
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
					 [req.session.username],function (error, result) {
		if (error) {
			console.error(error);
			return res.status(500).json({'dbError': 'check server log'}).end();
		}
		//console.log(result);
		if (result[0] === undefined){
			return res.status(400).json({'loginError': 'Wrong username or password'}).end();
		}
		var oldSaltedPassword = hmacPassword(req.body.oldPW,result[0].salt);
		//console.log(submitedSaltedPassword); //I made a mistake here and this is how to debug
		//console.log(result.rows[0].saltedPassword); // Output in the right position.
		// Didn't pass the credential.
		if (result.rowCount === 0 || result[0].saltedPassword != oldSaltedPassword) {
			return res.status(400).json({'loginError': 'Wrong old password'}).end();
		}
		var newSaltedPassword = hmacPassword(req.body.newPW, result[0].salt);
		connection.query('UPDATE users SET saltedPassword = ? WHERE username = ?',
		                 [newSaltedPassword, req.session.username],function (error, result) {
			if (error) {
				console.error(error);
				return res.status(500).json({'dbError': 'check server log'}).end();
			}
			res.redirect('/account/finish');
		});
	});
  }
 });
})

app.get('/test',function(req,res){
	// send to list
	var to = ['yek20025@hotmail.com']

	// this must relate to a verified SES account
	var from = 'test@shop63_ierg4210.com'


	// this sends the email
	// @todo - add HTML version
	ses.sendEmail( { 
		Source: from, 
		Destination: { ToAddresses: to },
		Message: {
			Subject: {
			Data: 'Testing mail'
			},
			Body: {
				Text: {
					Data: 'Testing',
				}
			}
		}
	}
	, function(err, data) {
		if(err) throw err
		console.log('Email sent:');
		console.log(data);
	 });
});


module.exports = app;