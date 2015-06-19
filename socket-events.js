var helper = require('./functions');
var mm = require('musicmetadata');
var fs = require('fs');


var tdwp = []
//	Arrays for holding lists of users
var connectedClients = []; //	client connected * can probably be removed in favor of connectedUsers
var connectedUsers = [];	//	List of connected users by their session id. User info gets stored in object
var seatedUsers = []; //	Usernames of users currently seated. Only they can push songs to the queue

var seektimes = []; //	List of all seek times returned upon request
var seekReturnCount = 0;
var songEndCount = 0;

var metadata = {}; //	Current metadata for song playing
var currentSong;	//	ID of the current song playing
currentSong = 'music/tdwp/escape.mp3';

exports = module.exports = function(io, availableUsers, tracks){
  
	io.on('connection', function(socket){
		console.log('Client has connected');

		//	When a user has authenticated, the client throws a connection signal
	    socket.on('connection', function(){

	        var file = fs.createReadStream(currentSong);
	        if( Object.getOwnPropertyNames(metadata).length === 0 ){
	            var parser = mm( file, function (err, m) {
	              if (err) throw err;
	              metadata = m;
	            });
	        }
	        fs.readFile(currentSong, function(err, buf){  
	            socket.emit('song', {buffer: buf, meta: metadata });
	        });
	    });

	    //	Client connects to page, requests to be authenticated
	    socket.on('authentication', function(data){

	    	if(!data){
		    	var existing = helper.checkForSession(socket.request.sessionID, connectedUsers);
		    	if( existing === false){
		    		socket.emit('not authenticated')
		    	} else{
		    		console.log('Already logged in somewhere else');
		    		socket.emit('too many connections');
		    	}
	    	}

	    	if(data){
	    		var yeah = helper.authenticate(availableUsers, data.username, data.password);
	    		if(yeah !== false ){
	    			socket.user = yeah;
	    			connectedUsers.push({id: socket.id, session: socket.request.sessionID, user: yeah } );
	    			connectedClients.push(socket.id);
	    			socket.emit('authenticated')
	    		} else{
	    			console.log('failed authentication');
	    			socket.emit('not authenticated');
	    		}
	    	}
	    });


	    socket.on('seek', function(){
	        seeker = socket.id;
	        socket.broadcast.emit('seektimes');
	    });

	    socket.on('seekReturn', function(data){
	        seektimes.push(data.time);
	        seekReturnCount++; 

	        if(seekReturnCount == connectedClients.length - 1){
	            var time = helper.getSeekAverage(seektimes);
	            io.sockets.connected[seeker].emit('setSeekTime', {seek: time} );
	            seekReturnCount = 0;
	            seektimes = [];
	        }
	    });

	    socket.on('queue track', function(data){
	        console.log(data);
	        tracks.findById(data.trackID, function (err, found) {
	          console.log(found);
	          tdwp.push(found.location);
	        });
	    });

	    //	Song has ended, load up the next song in the playlist
	    socket.on('end', function(){
	        songEndCount++;

	        if(songEndCount == connectedClients.length){
	            console.log('all clients over, start new song');

	            if(tdwp.length > 0){
	            	currentSong = tdwp.shift();	
	            } else{
	            	currentSong = 'music/tdwp/escape.mp3';
	            }
	            
	            var file = fs.createReadStream(currentSong);
	            var parser = mm( file, function (err, m) {
	                if (err) throw err;
	                metadata = m;
	            });

	            fs.readFile(currentSong, function(err, buf){  
	                socket.emit('song', {buffer: buf, meta: metadata });
	            });
	            songEndCount = 0;
	        }
	    });

	    
	    //	When a user wants to request a seat. Must check that it is a unique user
	    //	ie same user with multiple tabs open cant be able to occupy seats
	    socket.on('seat request', function(){

	        var s = helper.findUser(seatedUsers, socket.user);
	        if(s == false){
	             seatedUsers.push(socket.user);
	             socket.seated = true;
	        }
	        console.log('seated - ' + seatedUsers);
	    });

	    socket.on('chat message', function(data){
	    	console.log(data);
	        io.emit('chat message', {data: data});
	    });

	    socket.on('disconnect', function(){
	    	for(var i = 0; i< connectedUsers.length; i++){

	    		if(connectedUsers[i].user == socket.user ){
	    			connectedUsers.splice(i, 1);
	    		}
	    	}
	        var j = connectedClients.indexOf(socket.id);
	        connectedClients.splice(j, 1);
	    });
	});





}