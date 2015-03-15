var express = require('express'),
exphbs = require('express3-handlebars'),
mysql = require('mysql'),
config = require('../shop63-ierg4210.config.js'),
connectionpool = mysql.createPool(config),
bodyParser = require('body-parser'),
done=false;

var app = express.Router();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public/'));

app.get('/', function (req, res) {
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
			connection.query('select c.catid, c.name AS cat_name, pid, p.name AS pro_name, price, description from categories AS c LEFT JOIN products AS p ON c.catid = p.catid where c.catid =\'' + catid + '\'', function(err2, result) {
				if (err2) {
					console.error(err2);
					res.statusCode = 500;
					res.send({
						result: 'error',
						err:    err2.code
					});
				} else {
					res.render('home', { title: 'Home', categories: rows, products: result, category: result[0].cat_name});
				}
				connection.release();
		    });
		}
		});
	  } else {
		res.render('home', { title: 'Home', categories: rows});
	  }
    }
    connection.release();
   });
  }
 });
});

app.get('/product', function (req, res) {
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
			console.log('select p.catid, c.name AS cat_name, pid, p.name AS pro_name, price, description from products as p left join categories as c on p.catid = c.catid where p.pid =\'' + pid + '\'');
			connection.query('select p.catid, c.name AS cat_name, pid, p.name AS pro_name, price, description from products as p left join categories as c on p.catid = c.catid where p.pid =\'' + pid + '\'', function(err2, result) {
				if (err2) {
					console.error(err2);
					res.statusCode = 500;
					res.send({
						result: 'error',
						err:    err2.code
					});
				} else {
					console.log(result);
					res.render('product', { title: 'Product', categories: rows, product: result});
				}
				connection.release();
		    });
		}
		});
	  } else {
		res.render('product', { title: 'Product', categories: rows});
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