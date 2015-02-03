var http = require("http");
var express = require('express');
var app = express();
var __dirname = '/C/Users/USER/Desktop/ierg4210/shop63/Web'

http.createServer(function(request, response) {
  response.writeHead(200, {"Content-Type": "text/plain"});
  response.write("Hello World");
  response.end();
}).listen(process.env.PORT || 8888);

app.use('/images', express.static(__dirname + '/images'));
app.use('/lib', express.static(__dirname + '/lib'));
app.use('/css', express.static(__dirname + '/css'));

app.listen(process.env.PORT || 8888);