var express = require('express');
var SpotifyWebApi = require('spotify-web-api-node');
var config = require('./config');

var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
var stateKey = 'spotify_auth_state';
var html_dir = './public/';

var playlist_id = null;

var spotifyApi = new SpotifyWebApi({
    redirectUri : redirect_uri,
    clientId : config.client_id,
    clientSecret: config.client_secret
});


var app = express();
app.set('view engine', 'jade');

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/home.html');
});

app.get('/welcome', function(req, res){

    if (!spotifyApi.getAccessToken()) {
      console.log('No access token - redirect to login');
      return res.redirect('/login');
      
    }
    res.sendfile(html_dir + 'welcome.html')
});

app.get('/login', function(req, res) {

    var scopes = [ 'playlist-modify-public', 'playlist-modify-private', 'user-read-private' ];
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, stateKey);
    console.log('redirect to auth url\n');
    res.redirect(authorizeURL);  

});

app.get('/callback', function(req, res) {

  console.log('in callback');
  spotifyApi.authorizationCodeGrant( req.query.code )
  .then(function(data) {
    spotifyApi.setRefreshToken( data.body['refresh_token']);
    spotifyApi.setAccessToken( data.body['access_token'] );

    console.log('Successful auth');  
    return res.redirect('/welcome');  
    }, function(err) {
      console.log('Something went wrong in the callback!', err);
  });


});

//zVF6hmQihG5j

app.get('/addplaylist', function(req, res){

  spotifyApi.refreshAccessToken()
  .then(function(data){

    spotifyApi.createPlaylist(config.userID, 'arcadiaplaylist', { 'public' : true });

  }).then(function(data) {
    return res.send('Track added!');
    }, function(err) {
      return res.send(err.message);
  });
  
});

app.get('/search', function(req, res){

  var q = req.query;
  console.log(q.search);

  spotifyApi.searchTracks( q.search )
    .then(function(data) {
      console.log('Search tracks');
      res.json( data.body.tracks.items );
    }, function(err) {
      console.log('Something went wrong!', err);
    });



});

app.get('/getPlaylist', function(req, res){

  spotifyApi.refreshAccessToken()
  .then(function(data){
    spotifyApi.getUserPlaylists(config.userID)
    .then(function(data) {

      var playlists = data.body.items
      var length = playlists.length;

      for(var i = 0; i < length; i++){

        if( playlists[i].name == 'arcadiaplaylist'){
          playlist_id = playlists[i].id
        }
      }
      console.log(playlist_id + ' has been set for the playlist id \n')

      return res.redirect('back');
      
    },function(err) {
      console.log('Something went wrong!', err);
    })
  });

});

app.get('/addtrack', function(req, res){

  var q = req.query.track

  if( playlist_id == null){
    return res.redirect('/getPlaylist');
  }

  spotifyApi.refreshAccessToken()
  .then(function(data){
    spotifyApi.addTracksToPlaylist(config.userID, playlist_id, ["spotify:track:" +  q])
    .then(function(data) {
      console.log('addtrack - ' + q);
      return;
    }, function(err) {
      console.log('Something went wrong!', err);
      return;
    })
  });

});

console.log('--- Server Started on port 8888 ---');
app.listen(8888)