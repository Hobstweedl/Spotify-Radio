var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');

var tdwp = ['../music/tdwp/escape.mp3', '../music/tdwp/anatomy.mp3', '../music/tdwp/outnumbered.mp3']

var server = BinaryServer({ port: 9000 });

server.on('connection', function(client){

    console.log(client);

    client.on('stream', function(stream, meta){
        console.log('stream started?????');
        console.log(stream);
        console.log(meta);
    });

    var file = fs.createReadStream('../music/tdwp/escape.mp3');
    client.send(file);
    console.log('connection');
});