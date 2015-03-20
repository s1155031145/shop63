var express = require('express'),
exphbs = require('express-secure-handlebars'),
mysql = require('mysql'),
config = require('../shop63-ierg4210.config.js'),
connectionpool = mysql.createPool(config),
bodyParser = require('body-parser'),
done=false,
expressValidator = require('express-validator'),
cookieParser = require('cookie-parser'),
csrf = require('csurf');

var app = express.Router();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public/'));
app.use(expressValidator());

app.use(function(req, res, next){
    res.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'");
	res.header("X-Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'");
	res.header("X-WebKit-CSP", "default-src 'self'; script-src 'self' 'unsafe-inline'");
    next();
});

app.use(cookieParser()); 

app.use(csrf({ cookie: true }));
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
					res.render('home', { title: 'Home', categories: rows, products: result, category: result[0].cat_name, csrfToken: req.csrfToken()});
				}
				connection.release();
		    });
		}
		});
	  } else {
		res.render('home', { title: 'Home', categories: rows, csrfToken: req.csrfToken()});
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
  console.log('pid:'+pid);
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
					res.render('product', { title: 'Product', categories: rows, product: result, csrfToken: req.csrfToken()});
				}
				connection.release();
		    });
		}
		});
	  } else {
		res.render('product', { title: 'Product', categories: rows, csrfToken: req.csrfToken()});
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

module.exports = app;