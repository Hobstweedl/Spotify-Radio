var fs = require('fs');
var io = require('socket.io')(3000);
var mm = require('musicmetadata');

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

io.on('connection', function(socket){

    socket.on('connection', function(){
        console.log(socket.id);
        console.log(socket.conn);
        //console.log('connected with client - ' + socket.id + ' and session - ' + socket.io.engine.id );
        //connectedUsers.push(socket.io.engine.id)
        connectedClients.push(socket.id);

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
        console.log(data);
        seektimes.push(data.time);
        seekReturnCount++; 

        if(seekReturnCount == connectedClients.length - 1){
            var time = getSeekAverage(seektimes);
            io.sockets.connected[seeker].emit('setSeekTime', {seek: time} );
            console.log('average seek time - ' + time);
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