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
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/stream');

var schema = mongoose.Schema({
  "_id": mongoose.Schema.Types.ObjectId,
  "title"     :String,
  "artist"    :String,
  "album"     :String,
  "location"  :String
});

var tracks = mongoose.model('track', schema);
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var session = require("express-session");

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

app.get('/react', function(req, res){
  res.sendfile('public/react.html');
});


app.get('/api/artists', function(req, res){
	return tracks.distinct('artist', function(e, data){
		
		if(!e){
			return res.json(data);
		} else{
			return console.log(e);
		}
	});

});

app.get('/api/artist/:artist', function(req, res){

	return tracks.distinct('album',{artist : new RegExp([req.params.artist]) }, function(e, data){
		
		if(!e){
			return res.json(data);
		} else{
			return console.log(e);
		}
	});

});

app.get('/api/artists/:artist/album/:album', function(req, res){
	return tracks.find({album : new RegExp([req.params.album]), artist : new RegExp([req.params.artist]) }, function(e, data){
		
		if(!e){
			return res.json(data);
		} else{
			return console.log(e);
		}
	});

});

app.get('/api/track/:id', function(req, res){

	return tracks.findById(req.params.id, function(e, data){
		
		if(!e){
			return res.json(data);
		} else{
			return console.log(e);
		}
	});

});


/*	Socket Connection and events */

var ioEvents = require('./socket-events')(io, availableUsers, tracks);


http.listen(3000, function(){
  console.log('Server Started on Port :3000');
  console.log('----------------------------- \n');
});