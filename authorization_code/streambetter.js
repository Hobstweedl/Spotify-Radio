var fs = require('fs');
var io = require('socket.io')(3000);
var mm = require('musicmetadata');

var tdwp = ['../music/tdwp/escape.mp3', '../music/tdwp/anatomy.mp3', '../music/tdwp/outnumbered.mp3']

var connectedClients = [];
var seektimes = [];
var seekReturnCount = 0;

var metadata = {};
var currentSong;
currentsong = tdwp.shift();

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
        console.log('client connected - ' + socket.id);
        connectedClients.push(socket.id);

        var file = fs.createReadStream(currentsong);
        if( Object.getOwnPropertyNames(metadata).length === 0 ){
            var parser = mm( file, function (err, m) {
              if (err) throw err;
              metadata = m;
            });
        }
        fs.readFile(currentsong, function(err, buf){  
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
            console.log('average seek time - ' + time);
        }
    });


    

});