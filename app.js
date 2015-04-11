var express = require('express'),
exphbs = require('express-secure-handlebars'),
backEndRouter = require('./routes/backend.js'),
frontEndRouter = require('./routes/frontend.js'),
authAPIRouter = require('./routes/Auth.api.js');

var app = express();

app.engine('hbs', exphbs({
	defaultLayout:'main', extname: '.hbs',
	partialsDir: [
        'shared/templates/',
        'views/partials/'
    ]	
})); 
app.set('view engine', 'hbs');

app.use(express.static('public/'));
app.use(function(req, res, next){
    res.header("Content-Security-Policy", "default-src 'self'");
	res.header("X-Content-Security-Policy", "default-src 'self'");
	res.header("X-WebKit-CSP", "default-src 'self'");
    next();
});

//app.use('/admin', function(req, res, next) {
//var schema = req.headers['x-forwarded-proto'];
//if (schema === 'https') {
//// Already https; don't do anything special.
//next();
//}
//else {
//// Redirect to https.
//res.redirect('https://' + req.headers.host + req.url + '/admin');
//}
//});

app.use('/admin', authAPIRouter);
app.use('/admin', backEndRouter);

app.use('/', frontEndRouter);

app.listen(process.env.PORT || 8888);