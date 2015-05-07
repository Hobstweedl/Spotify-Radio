var http = require('http');
var server = require('./server');
var router = require('./router');

server.start(http, router.route, handle);