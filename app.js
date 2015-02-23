var express = require('express'),
exphbs = require('express3-handlebars'),
backEndRouter = require('./routes/backend.js'),
frontEndRouter = require('./routes/frontend.js');

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
app.use('/admin', backEndRouter);

app.use('/', frontEndRouter);

app.listen(process.env.PORT || 8888);