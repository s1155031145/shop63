var express = require('express'),
exphbs = require('express-secure-handlebars'),
backEndRouter = require('./routes/backend.js'),
frontEndRouter = require('./routes/frontend.js'),
authAPIRouter = require('./routes/Auth.api.js'),
//xFrameOptions = require('x-frame-options'),
//xssFilter = require('x-xss-protection'),
//sts = require('strict-transport-security'),
helmet = require('helmet');

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
    res.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'");
	res.header("X-Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'");
	res.header("X-WebKit-CSP", "default-src 'self'; script-src 'self' 'unsafe-inline'");
    next();
});

//app.use(xFrameOptions());
app.use(helmet.frameguard());  // Same-origin by default. 

app.set('etag', 'strong');

//app.use(xssFilter());
app.use(helmet.xssFilter());

//var globalSTS = sts.getSTS({"max-age":{days:30}});
//app.use(globalSTS);
app.use(helmet.hsts({ maxAge: 2592000000 }));

app.use(helmet.hidePoweredBy());
app.use(helmet.noSniff());


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