var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var SpotifyWebApi = require('spotify-web-api-node');

var config = require('./config');

var client_id = config.client_id; // Your client id
var client_secret = config.client_secret; // Your client secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
var apicode = '';
var auth_code = '';
var refresh_code = '';

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());

app.get('/login', function(req, res) {

  console.log('Attempting to login \n');
  var scopes = ['playlist-modify-public'],
  clientId = client_id;

  // Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
  var spotifyApi = new SpotifyWebApi({
    redirectUri : redirect_uri,
    clientId : clientId
  });

  // Create the authorization URL
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, stateKey);

  res.redirect(authorizeURL);  

});

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;
  apicode = code;

  res.clearCookie(stateKey);

  var spotifyApi = new SpotifyWebApi({
    redirectUri : redirect_uri,
    clientId : client_id,
    clientSecret: client_secret
  });

  spotifyApi.authorizationCodeGrant(apicode)
    .then(function(data) {
      //console.log('The token expires in ' + data.body['expires_in']);
      //console.log('The access token is ' + data.body['access_token']);
      //console.log('The refresh token is ' + data.body['refresh_token']);

      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
      console.log('Callback Success');
    }, function(err) {
      console.log('Something went wrong!', err);
    });

    res.redirect('/welcome');

});

app.get('/welcome',function(req,res){
  var options = {
    root: __dirname + '/public/' 
  }

  res.sendFile('/welcome.html', options, function (err) {
     if (err) {
         console.log('Error in res : %s, status code: %s', err, res.statusCode);      
         res.status(err.status).end();
     }
     else {
         console.log('Sent: ', 'welcome.html');
      }
  });
});


app.get('/addplaylist', function(req, res){

  console.log(auth_code + ' <--auth refresh -->' + refresh_code);

  var credentials = {
    redirectUri : redirect_uri,
    clientId : client_id,
    clientSecret : client_secret
  }

  var spotifyApi = new SpotifyWebApi(credentials);

  spotifyApi.createPlaylist(config.userID, 'Table List', { 'public' : true })
  .then(function(data) {
    console.log('Created playlist!');
  }, function(err) {
    console.log('Something went wrong!', err);

    if(err.statusCode == '401'){
      res.redirect('/login');
    }
  });




});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
