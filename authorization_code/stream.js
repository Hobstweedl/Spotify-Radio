var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');

var tdwp = ['../music/tdwp/escape.mp3', '../music/tdwp/anatomy.mp3', '../music/tdwp/outnumbered.mp3']

var server = BinaryServer({ port: 9000, chunkSize: 100 });
var seektimes = [];
var clients = [];
var seekreturnids = []

server.on('connection', function(client){
    clients.push(client);

    client.on('stream', function(stream, meta){
    	var metadata = JSON.parse(meta);

    	switch(metadata.event){
    		case 'startsong':
    			console.log('New connection, launch song in progress');
    			var file = fs.createReadStream('../music/tdwp/escape.mp3');
    			client.send(file, 'startsong');
    		break;

    		case 'songend':
    		break;

    		case 'seek':
                for(var i = 0; i < clients.length; i++){
                    if(clients[i].id !== client.id){
                        clients[i].send({}, 'seek');
                    }
                }
    		break;

            case 'seekReturn':
                seektimes.push(metadata.time);
                seekreturnids.push(client.id);
                var sum = 0
                var l = seektimes.length;
                for( var j = 0; j < l; j++){
                    sum += seektimes[j];
                }
                var avg = sum/l;
                for(var i = 0; i < clients.length; i++){
                    var success = seekreturnids.indexOf( clients[i].id);

                    if(success == -1){
                        clients[i].send(avg, 'playsong');
                    }
                }

                seekreturnids = [];
                seektimes = [];
                
            break;

    		default: 
    			//console.log('could not find action');
    		break;
    	}
        
    });

    client.on('close', function(stream, meta){
    	console.log('Connection Terminated');
        for( var i = 0; i < clients.length; i++){
            if(client.id == clients[i].id ){
                clients.splice(i, 1);
            }
        }
    });

    //var file = fs.createReadStream('../music/tdwp/escape.mp3');
    //client.send(file);
    //console.log('Connection Started');
});