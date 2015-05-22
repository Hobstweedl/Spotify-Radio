var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');

var tdwp = ['../music/tdwp/escape.mp3', '../music/tdwp/anatomy.mp3', '../music/tdwp/outnumbered.mp3']

var server = BinaryServer({ port: 9000, chunkSize: 100 });
var numberofClients = 0;

server.on('connection', function(client){
	numberofClients++;

    client.on('stream', function(stream, meta){
    	var metadata = JSON.parse(meta);
    	console.log(metadata.event);

    	switch(metadata.event){
    		case 'startsong':
    			console.log('New connection, launch song in progress');
    			var file = fs.createReadStream('../music/tdwp/escape.mp3');
    			client.send(file);
    		break;

    		case 'songend':
    			console.log('Song ended, start new song');
    		break;

    		case 'seek':
    			console.log('Poll connections for seek time');
    		break;

    		default: 
    			console.log('could not find action');
    		break;
    	}
        
    });

    client.on('close', function(stream, meta){
    	console.log('Connection Terminated');
    	numberofClients--;
    });

    //var file = fs.createReadStream('../music/tdwp/escape.mp3');
    //client.send(file);
    console.log('Connection Started');
});