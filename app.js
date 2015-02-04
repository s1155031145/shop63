var express = require('express');

var app = express();

app.use(express.static('public/'));

app.listen(8888, function () {
    console.log('express-handlebars example server listening on: 3000');
});