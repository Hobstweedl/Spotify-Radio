var http = require('http');
var server = require('./server');
var router = require('./router');

router.get('start', function(){
    console.log('Hello World');
    router.send('test for echo');
});

router.get('end', 'Goodbye!');

server.start(http, router);