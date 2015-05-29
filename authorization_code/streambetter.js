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

var fs = require('fs');
var mm = require('musicmetadata');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var session = require("express-session");

var tdwp = ['../music/tdwp/escape.mp3', '../music/tdwp/anatomy.mp3', '../music/tdwp/outnumbered.mp3']

//	Arrays for holding lists of users
var connectedClients = []; //	client connected * can probably be removed in favor of connectedUsers
var connectedUsers = [];	//	List of connected users by their session id. User info gets stored in object
var seatedUsers = []; //	Usernames of users currently seated. Only they can push songs to the queue

var seektimes = []; //	List of all seek times returned upon request
var seekReturnCount = 0;
var songEndCount = 0;

var metadata = {}; //	Current metadata for song playing
var currentSong;	//	ID of the current song playing
currentSong = tdwp.shift();

var availableUsers= [
	{ name: "hobstweedl", password: "304421jr"},
	{ name: "maxdadi", password: "walker"},
	{ name: "yogurt", password: "greek"},
	{ name: "teejay", password: "green"}

];

var sessionMiddleware = session({
    secret: "W0tm8",
    saveUninitialized: true,
    resave: true
});

/* Configuration Settings and Routes */

app.use(sessionMiddleware);
app.use(express.static('public'));

io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

app.get('/stream', function(req, res){
  res.sendfile('public/stream.html');
});


/*	Socket Connection */


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
	    	var existing = checkForSession(socket.request.sessionID, connectedUsers);
	    	if( existing === false){
	    		socket.emit('not authenticated')
	    	} else{
	    		console.log('Already logged in somewhere else');
	    		socket.emit('too many connections');
	    	}
    	}

    	if(data){
    		var yeah = authenticate(availableUsers, data.username, data.password);
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
            var time = getSeekAverage(seektimes);
            io.sockets.connected[seeker].emit('setSeekTime', {seek: time} );
            seekReturnCount = 0;
            seektimes = [];
        }
    });

    //	Song has ended, load up the next song in the playlist
    socket.on('end', function(){
        songEndCount++;

        if(songEndCount == connectedClients.length){
            console.log('all clients over, start new song');

            currentSong = tdwp.shift();
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

        var s = findUser(seatedUsers, socket.user);
        if(s == false){
             seatedUsers.push(socket.user);
             socket.seated = true;
        }
        console.log(seatedUsers);
    });

    socket.on('chat message', function(msg){
        io.emit('chat message', {msg: msg, username: socket.user });
    });

    

    socket.on('disconnect', function(){
    	console.log(connectedUsers);
    	for(var i = 0; i< connectedUsers.length; i++){

    		if(connectedUsers[i].user == socket.user ){
    			connectedUsers.splice(i, 1);
    		}
    	}
        var j = connectedClients.indexOf(socket.id);
        connectedClients.splice(j, 1);
    });
});


http.listen(3000, function(){
  console.log('Server Started on Port :3000');
});

//	Tertiary functions for login, getting the seek time, and finding unique users

function authenticate(arr, username, password){
	var l = arr.length;
	for(var i = 0; i < l; i++){
		if( arr[i].name == username){
			
			if( arr[i].password == password){
				return arr[i].name;
			}
		}
	}
	return false;
}

function getSeekAverage( avgs ){
    var sum = 0
    var l = avgs.length;
    for( var j = 0; j < l; j++){
        sum += avgs[j];
    }
    var avg = sum/l;

    return avg;
}

function findUser(arr, username){
    var l = arr.length;
    var found = false;

    for( var i = 0; i < l; i++){
        if(arr[i] == username){
            found = true;
        }
    }
    return found;
}

function checkForSession(session, arr){
	for( var i = 0; i < arr.length; i++){
		if(arr[i].session == session){
			return arr[i].session
		}
	}

	return false;
}