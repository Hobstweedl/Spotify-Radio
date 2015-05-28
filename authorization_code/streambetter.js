var fs = require('fs');
var mm = require('musicmetadata');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var session = require("express-session");

var tdwp = ['../music/tdwp/escape.mp3', '../music/tdwp/anatomy.mp3', '../music/tdwp/outnumbered.mp3']

var connectedClients = [];
var connectedUsers = [];
var seatedUsers = [];

var seektimes = [];
var seekReturnCount = 0;
var songEndCount = 0;

var metadata = {};
var currentSong;
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


/*	Socket Connectsion */


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
	    	console.log('authenticating - ' + socket.request.sessionID);
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
        console.log('seat requested');

        var s = findUser(seatedUsers, socket.request.sessionID);
        if(s == false){
             seatedUsers.push(socket.request.sessionID);
        }
    });

    socket.on('chat message', function(msg){
        io.emit('chat message', {msg: msg, username: socket.user });
    });

    

    socket.on('disconnect', function(){
        var i = connectedClients.indexOf(socket.id);
        connectedClients.splice(i, 1);
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

function findUser(arr, sessionID){
    var l = arr.length;
    var found = false;

    for( var i = 0; i < l; i++){
        if(arr[i] == sessionID){
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