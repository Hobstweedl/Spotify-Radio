var http = require('http');
var server = require('./server');
var router = require('./router');

router.get('start', function(r){
    content = 'hello world';
    r.write('hello world');
});

server.start(http, router);