var express = require('express'),
exphbs = require('express-secure-handlebars'),
mysql = require('mysql'),
config = require('../shop63-ierg4210.config.js'),
connectionpool = mysql.createPool(config),
bodyParser = require('body-parser'),
multer  = require('multer'),
fs = require('fs'),
done=false;

var app = express.Router();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public/'));

app.get('/', function (req, res) {
 res.render('admin/home', {
        title: 'Home'
    });
});

app.get('/add_categories', function (req, res) {
 res.render('admin/add_categories', {
        title: 'Add Categories', csrfToken: req.csrfToken()
    });
});

app.get('/change_categories', function(req,res){
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
	 res.render('admin/change_categories', { title: 'Change Categories', categories: rows, csrfToken: req.csrfToken()});
    }
    connection.release();
   });
  }
 });
});

app.get('/delete_categories', function(req,res){
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
	 res.render('admin/delete_categories', { title: 'Delete Categories', categories: rows, csrfToken: req.csrfToken()});
    }
    connection.release();
   });
  }
 });
});

app.get('/add_products', function(req,res){
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
	 res.render('admin/add_products', { title: 'Add Products', categories: rows, csrfToken: req.csrfToken()});
    }
    connection.release();
   });
  }
 });
});

app.get('/change_products', function(req,res){
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
	 res.render('admin/change_products', { title: 'Change Products', categories: rows});
    }
    connection.release();
   });
  }
 });
});

app.get('/delete_products', function(req,res){
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
	 res.render('admin/delete_products', { title: 'Delete Products', categories: rows});
    }
    connection.release();
   });
  }
 });
});

app.get('/change_products2', function(req,res){
  req.checkQuery('categories', 'Invalid catid').notEmpty().isInt();
  req.sanitize('categories').toInt();
	if (req.validationErrors()) {
	return res.status(400).json({'Invalid Input': req.validationErrors()}).end();
	}
  var catid = req.query.categories;
  connectionpool.getConnection(function(err, connection) {
  if (err) {
      console.error('CONNECTION error: ',err);
      res.statusCode = 503;
      res.send({
          result: 'error',
          err:    err.code
      });
  } else {
    connection.query('select c.catid, c.name AS cat_name, pid, p.name AS pro_name, price, description from categories AS c LEFT JOIN products AS p ON c.catid = p.catid where c.catid = ? ', [catid], function(err, rows) {
    if (err) {
        console.error(err);
        res.statusCode = 500;
        res.send({
            result: 'error',
            err:    err.code
        });
    } else {
	 console.log(rows);
	 res.render('admin/change_products2', { title: 'Change Products', products: rows});
    }
    connection.release();
   });
  }
 });
});

app.get('/change_products3', function(req,res){
  var product_value = JSON.parse(req.query.product);
  NameRegExp = /^[\w- '()+,.!?:$%/]+$/;
  PriceRegExp = /^\d+(?:\.\d{1,2})?$/;
  DescRegExp = /^[\w- '()+,.!?:$%/\r\n]+$/;
  if (!(product_value.cat_id == parseInt(product_value.cat_id)) || !NameRegExp.test(product_value.name) || !(product_value.pid == parseInt(product_value.pid)) || !PriceRegExp.test(product_value.price) || !DescRegExp.test(product_value.desc)){
	return res.status(400).end('Invalid Input: '+parseInt(product_value.cat_id)+' '+NameRegExp.test(product_value.name)+' '+parseInt(product_value.pid)+' '+PriceRegExp.test(product_value.price)+' '+DescRegExp.test(product_value.desc));
  }
  console.log(product_value.cat_name);
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
	 res.render('admin/change_products3', { title: 'Change Products', categories: rows, product: product_value, csrfToken: req.csrfToken()});
    }
    connection.release();
   });
  }
 });
});

app.get('/delete_products2', function(req,res){
  req.checkQuery('categories', 'Invalid catid').notEmpty().isInt();
  req.sanitize('categories').toInt();
	if (req.validationErrors()) {
	return res.status(400).json({'Invalid Input': req.validationErrors()}).end();
	}
  var catid = req.query.categories;
  connectionpool.getConnection(function(err, connection) {
  if (err) {
      console.error('CONNECTION error: ',err);
      res.statusCode = 503;
      res.send({
          result: 'error',
          err:    err.code
      });
  } else {
    connection.query('select * from products where catid = ? ', [catid], function(err, rows) {
    if (err) {
        console.error(err);
        res.statusCode = 500;
        res.send({
            result: 'error',
            err:    err.code
        });
    } else {
	 res.render('admin/delete_products2', { title: 'Delete Products', products: rows, csrfToken: req.csrfToken()});
    }
    connection.release();
   });
  }
 });
});

app.post('/add_cat_result', function(req,res){
  NameRegExp = /^[\w- '()+,.!?:$%/]+$/;
  if (!NameRegExp.test(req.body.name)){
	return res.status(400).end('Invalid Input');
  }
  var cat_name = req.body.name;
  connectionpool.getConnection(function(err, connection) {
  if (err) {
      console.error('CONNECTION error: ',err);
      res.statusCode = 503;
      res.send({
          result: 'error',
          err:    err.code
      });
  } else {
    connection.query('INSERT INTO categories (name) VALUES (?)', [cat_name], function(err, rows) {
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
});

app.post('/change_cat_result', function(req,res){
  req.checkBody('catid', 'Invalid catid').notEmpty().isInt();
  req.sanitize('catid').toInt();
	if (req.validationErrors()) {
	return res.status(400).json({'Invalid Input': req.validationErrors()}).end();
	}
  NameRegExp = /^[\w- '()+,.!?:$%/]+$/;
  if (!NameRegExp.test(req.body.new_name)){
	return res.status(400).end('Invalid Input');
  }
  var catid = req.body.catid, 
  new_name = req.body.new_name;
  connectionpool.getConnection(function(err, connection) {
  if (err) {
      console.error('CONNECTION error: ',err);
      res.statusCode = 503;
      res.send({
          result: 'error',
          err:    err.code
      });
  } else {
    connection.query('UPDATE categories SET name = ? WHERE catid = ?', [new_name, catid], function(err, rows) {
    if (err) {
        console.error(err);
        res.statusCode = 500;
        res.send({
            result: 'error',
            err:    err.code
        });
    } else {
	 res.render('admin/result', { title: 'Change Categories', result: 'success!'});
    }
    connection.release();
   });
  }
 });
});

app.post('/delete_cat_result', function(req,res){
  req.checkBody('catid', 'Invalid catid').notEmpty().isInt();
  req.sanitize('catid').toInt();
	if (req.validationErrors()) {
	return res.status(400).json({'Invalid Input': req.validationErrors()}).end();
	}
  var catid = req.body.catid;
  connectionpool.getConnection(function(err, connection) {
  if (err) {
      console.error('CONNECTION error: ',err);
      res.statusCode = 503;
      res.send({
          result: 'error',
          err:    err.code
      });
  } else {
    connection.query('DELETE FROM categories WHERE catid = ?', [catid], function(err, rows) {
    if (err) {
        console.error(err);
        res.statusCode = 500;
        res.send({
            result: 'error',
            err:    err.code
        });
    } else {
	 res.render('admin/result', { title: 'Delete Categories', result: 'success!'});
    }
    connection.release();
   });
  }
 });
});


app.use('/add_pro_result', multer({ dest: './public/images',
 rename: function (fieldname, filename) {
	return 'new';
  },
onFileUploadStart: function (file) {
  console.log(file.originalname + ' is starting ...')
},
onFileUploadComplete: function (file) {
  console.log(file.fieldname + ' uploaded to  ' + file.path)
  done=true;
}
}));

app.post('/add_pro_result',function(req,res){
  NameRegExp = /^[\w- '()+,.!?:$%/]+$/;
  PriceRegExp = /^\d+(?:\.\d{1,2})?$/;
  DescRegExp = /^[\w- '()+,.!?:$%/\r\n]+$/;
  if (!(req.body.catid == parseInt(req.body.catid)) || !NameRegExp.test(req.body.name) || !PriceRegExp.test(req.body.price) || !DescRegExp.test(req.body.desc)){
	return res.status(400).end('Invalid Input: '+parseInt(req.body.catid)+' '+NameRegExp.test(req.body.name)+' '+PriceRegExp.test(req.body.price)+' '+DescRegExp.test(req.body.desc));
  }
  var catid = req.body.catid;
  var pro_name = req.body.name;
  var price = req.body.price;
  var desc = req.body.desc;
  if(done==true){
    console.log(req.files);
	connectionpool.getConnection(function(err, connection) {
     if (err) {
         console.error('CONNECTION error: ',err);
         res.statusCode = 503;
         res.send({
             result: 'error',
             err:    err.code
         });
     } else {
      connection.query('INSERT INTO products (catid,name,price,description) VALUES (?,?,?,?)', [catid, pro_name, price, desc], function(err, rows) {
       if (err) {
           console.error(err);
           res.statusCode = 500;
           res.send({
               result: 'error',
               err:    err.code
           });
		   return;
       }
      });
	  connection.query('SELECT pid FROM products WHERE name = ?', [pro_name], function(err, rows) {
       if (err) {
           console.error(err);
           res.statusCode = 500;
           res.send({
               result: 'error',
               err:    err.code
           });
		   return;
       } else {
	     fs.rename('./public/images/new.jpg', './public/images/'+rows[0].pid.toString()+'.jpg', function (err) {
		   if (err) throw err;
			console.log('renamed complete');
		   });
       }
       connection.release();
      });
     }
    }); 
	res.render('admin/result', { title: 'Add Products', result: 'Success.'});
  }
});


app.use('/change_pro_result', multer({ dest: './public/images',
 rename: function (fieldname, filename) {
	return 'new';
  },
onFileUploadStart: function (file) {
  console.log(file.originalname + ' is starting ...')
},
onFileUploadComplete: function (file) {
  console.log(file.fieldname + ' uploaded to  ' + file.path)
  done=true;
}
}));

app.post('/change_pro_result',function(req,res){
  //console.log('Change Pro Result')
  NameRegExp = /^[\w- '()+,.!?:$%/]+$/;
  PriceRegExp = /^\d+(?:\.\d{1,2})?$/;
  DescRegExp = /^[\w- '()+,.!?:$%/\r\n]+$/;
  if (!(req.body.catid == parseInt(req.body.catid)) || !NameRegExp.test(req.body.name) || !(req.body.pid == parseInt(req.body.pid)) || !PriceRegExp.test(req.body.price) || !DescRegExp.test(req.body.desc)){
	return res.status(400).end('Invalid Input: '+parseInt(req.body.catid)+' '+NameRegExp.test(req.body.name)+' '+parseInt(req.body.pid)+' '+PriceRegExp.test(req.body.price)+' '+DescRegExp.test(req.body.desc));
  }
  var catid = req.body.catid,
  pid = req.body.pid,
  pro_name = req.body.name,
  price = req.body.price,
  desc = req.body.desc;
    console.log(req.files);
	connectionpool.getConnection(function(err, connection) {
     if (err) {
         console.error('CONNECTION error: ',err);
         res.statusCode = 503;
         res.send({
             result: 'error',
             err:    err.code
         });
     } else {
      connection.query('UPDATE products SET catid = ?,name = ?,price = ?,description = ? WHERE pid = ?', [catid, pro_name, price, desc, pid], function(err, rows) {
       if (err) {
           console.error(err);
           res.statusCode = 500;
           res.send({
               result: 'error',
               err:    err.code
           });
		   return;
       }
      });
	  connection.query('SELECT pid FROM products WHERE name = ?', [pro_name], function(err, rows) {
       if (err) {
           console.error(err);
           res.statusCode = 500;
           res.send({
               result: 'error',
               err:    err.code
           });
		   return;
       } else {
	     fs.exists('./public/images/new.jpg', function(exists) {
           if (exists) {
             //fs.unlinkSync('./public/images/'+pid+'.jpg');
	         fs.rename('./public/images/new.jpg', './public/images/'+pid+'.jpg', function (err) {
		       if (err) console.error(err);
			     console.log('renamed complete');
		     });
           }
         });
       }
       connection.release();
      });
     }
    }); 
	res.render('admin/result', { title: 'Add Products', result: 'Success.'});

});

app.post('/delete_pro_result', function(req,res){
  req.checkBody('pid', 'Invalid catid').notEmpty().isInt();
  req.sanitize('pid').toInt();
	if (req.validationErrors()) {
	return res.status(400).json({'Invalid Input': req.validationErrors()}).end();
	}
  var pid = req.body.pid;
  connectionpool.getConnection(function(err, connection) {
  if (err) {
      console.error('CONNECTION error: ',err);
      res.statusCode = 503;
      res.send({
          result: 'error',
          err:    err.code
      });
  } else {
    connection.query('DELETE FROM products WHERE pid = ?', [pid], function(err, rows) {
    if (err) {
        console.error(err);
        res.statusCode = 500;
        res.send({
            result: 'error',
            err:    err.code
        });
    } else {
	  fs.unlink('./public/images/'+pid+'.jpg', function (err) {
        if (err) console.error(err);
          console.log('successfully deleted /tmp/hello');
      });
	  res.render('admin/result', { title: 'Delete Products', result: 'success!'});
    }
    connection.release();
   });
  }
 });
});

module.exports = app;