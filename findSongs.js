var fs = require('fs');
var mm = require('musicmetadata');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/stream');

var trackSchema = new mongoose.Schema({
	"title"     :String,
	"artist"    :String,
	"album"     :String,
	"location"  :String
});
 
var db = mongoose.connection;
 
db.on('error', function (err) {
console.log('connection error', err);
});
db.once('open', function () {
console.log('connected.');
});

var track = mongoose.model('Track', trackSchema);


var walkPath = 'music';

var walk = function (dir, done) {
    fs.readdir(dir, function (error, list) {
        if (error) {
            return done(error);
        }

        var i = 0;

        (function next () {
            var file = list[i++];

            if (!file) {
                return done(null);
            }
            
            file = dir + '/' + file;
            
            fs.stat(file, function (error, stat) {
        
                if (stat && stat.isDirectory()) {
                    walk(file, function (error) {
                        next();
                    });
                } else {
                    // do stuff to file here
                    var song = fs.createReadStream(file);
                    var parser = mm( song, function (err, m) {
                        if (err) console.log('Error on : ' + file);

                        track.find(
                            {title: m.title, album: m.album, artist : m.artist[0], location: file}, 
                            function(error, data){
                                if(data.length){
                                    console.log(m.title + ' - already exists');
                                } else{
                                    var insert = new track({
                                        title: m.title,
                                        artist: m.artist[0],
                                        album: m.album,
                                        location: file
                                    });
                                     
                                    insert.save(function (err, data) {
                                    if (err) console.log(err);
                                    else console.log('Saved : ', data );
                                    });

                                }   //  End else
                        }); //  End track find
                    });

                    next();
                }
            });
        })();
    });
};

// optional command line params
//      source for walk path
process.argv.forEach(function (val, index, array) {
    if (val.indexOf('source') !== -1) {
        walkPath = val.split('=')[1];
    }
});

console.log('-------------------------------------------------------------');
console.log('processing...');
console.log('-------------------------------------------------------------');

walk(walkPath, function(error) {
    if (error) {
        throw error;
    } else {
        console.log('-------------------------------------------------------------');
        console.log('finished.');
        console.log('-------------------------------------------------------------');
    }
});




/*var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/play');

var schema = mongoose.Schema({
  "_id": mongoose.Schema.Types.ObjectId,
  "title"     :String,
  "artist"    :String,
  "album"     :String,
  "year"      :String,
  "location"  :String
});
var tracks = mongoose.model('track', schema);
var results = tracks.find(function(err,f){
  if (err) return console.error(err);
  console.log(f);
});

*/