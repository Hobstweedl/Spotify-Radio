var fs = require('fs');
var mm = require('musicmetadata');
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var session = require("express-session");

var sessionMiddleware = session({
    secret: "W0tm8",
});

app.use(sessionMiddleware);
app.use(express.static('public'));

io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

app.get('/stream', function(req, res){
  res.sendfile('public/stream.html');
});

var tdwp = ['../music/tdwp/escape.mp3', '../music/tdwp/anatomy.mp3', '../music/tdwp/outnumbered.mp3']

var connectedClients = [];
var connectedUsers = [];
var seektimes = [];
var seekReturnCount = 0;
var songEndCount = 0;

var metadata = {};
var currentSong;
currentSong = tdwp.shift();

//  io.sockets.connected[socketId] - get socket by the id

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
        console.log(arr[i]);
        if(arr[i] == sessionID){
            found = true;
        }
    }
    return found;
}

io.on('connection', function(socket){

    socket.on('connection', function(){

        var s = findUser(connectedUsers, socket.request.sessionID);
        
        connectedUsers.push(socket.request.sessionID);
        connectedClients.push(socket.id);
        console.log('found? ' + s);
        console.log(connectedUsers);

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

    socket.on('disconnect', function(){
        var i = connectedClients.indexOf(socket.id);
        connectedClients.splice(i, 1);
    });


    

});


http.listen(3000, function(){
  console.log('listening on *:3000');
});