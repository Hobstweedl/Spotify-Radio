/*
	Have song ending and going to new song
	Things to do

	-	Clean up code
			Modular, need functions, more separation

	-	Create seats for people to add music
			Person in seat can choose a song to push to the list
			List has to play in the order that people are in seats
			Also keep track of which seat position we are currently at

	-	List of songs
			Grab a music folder, go through list and store songs in database
			Easy to access, search for the seated user

	-	UI
			Need to make a pretty UI





*/

var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');
var bunyan = require('bunyan');
var log = bunyan.createLogger({name: "myapp"});

var tdwp = ['../music/tdwp/escape.mp3', '../music/tdwp/anatomy.mp3', '../music/tdwp/outnumbered.mp3']
var currentSong = '';
var server = BinaryServer({ port: 9000, chunkSize: 100 });
var clients = [];

var songendcount = 0;
/*

	These three variables are for capturing the clients and times that respond with 
	a play/seek time, and the seeker is the id of the client requesting an average

*/
var seektimes = [];
var seekreturnids = []
var seeker;

currentsong = tdwp.shift();
server.on('connection', function(client){
    clients.push(client);

    client.on('stream', function(stream, meta){
    	var metadata = JSON.parse(meta);

    	switch(metadata.event){
    		case 'startsong':
    			console.log('New connection, launch song in progress');
    			console.log('current song is ' + currentsong);
    			var file = fs.createReadStream(currentsong);
    			client.send(file, 'startsong');
    		break;

    		case 'songend':
    		songendcount++;

    		if(songendcount == clients.length){
    			console.log('all clients over, start new song');
    			currentsong = tdwp.shift();
    			var file = fs.createReadStream(currentsong);
    			client.send(file, 'startsong');
    		}
    		break;

    		case 'seek':
    			//	capture the id of the client that requested an average seek time
    			seeker = client.id;
    			console.log('seeker id is ' + seeker);
                for(var i = 0; i < clients.length; i++){
                    if(clients[i].id !== client.id){
                    	//	send a request to every other client for their current play time
                        clients[i].send({}, 'seek');
                    }
                }
    		break;

            case 'seekReturn':
            	//	Clients are returning their current play time
                seektimes.push(metadata.time);
                seekreturnids.push(client.id); //	literally an array to make sure every other client responds
                

            break;

            case 'seat':
                console.log('seat - ' + metadata.seat + ' requested');
            break;

    		default: 
    			//console.log('could not find action');
    		break;
    	}

    	//	Compile average seek time of current clients, and send it out to the requester
    	if( (clients.length - 1 == seekreturnids.length) && (clients.length > 1) ){
    		console.log('ready to emit');

    		var sum = 0
    		var l = seektimes.length;
    		for( var j = 0; j < l; j++){
    		    sum += seektimes[j];
    		}
    		
    		var avg = sum/l;
    		console.log('seeker id - ' + seeker);
    		for(var z = 0; z < clients.length; z++){
    			if(clients[z].id == seeker){
    				clients[z].send(avg, 'setseektime');
    				seekreturnids = [];
    				seektimes = [];
    			}	
    		}
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
});

