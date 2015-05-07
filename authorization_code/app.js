/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri

var config = require('./config.js');
var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser());





var router = require('./routes.js')(app);

console.log('Listening on 8888');
app.listen(8888);
