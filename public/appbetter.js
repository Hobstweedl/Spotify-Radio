var socket = io('http://localhost:3000');
var audioCtx = new AudioContext();
var myAudio = document.querySelector('audio');
var source = audioCtx.createMediaElementSource(myAudio);
source.connect( audioCtx.destination );

var $pp  = $('#playpause'),
$vol = $('#volume');
var lastVolume = 0;

function compilePanel(title, items, id){
  var htmlList = '<div class="panel panel-info" id="' + id + '">' +
          '<div class="panel-heading">' +
              '<h3 class="panel-title"> ' + title +' </h3>' +
              '<span class="pull-right clickable" data-effect="slideUp"><i class="fa fa-times"></i></span>' +
          '</div>' +
          '<div class="panel-body">' + items + 
          '</div>'+
        '</div>';

  return htmlList;
}


function getTime(t) {
  var m=~~(t/60), s=~~(t % 60);
  return (m<10?"0"+m:m)+':'+(s<10?"0"+s:s);
}

function progress() {
  var p = 100/myAudio.duration*myAudio.currentTime;
  $('.progress-bar').css('width', p+'%');
  $('.time').text(getTime(myAudio.currentTime) );
}

$vol.slider( {
  value : myAudio.volume*75,
  animate: "fast",
  slide : function(ev, ui) {
    $vol.css({background:"hsla(180,"+ui.value+"%,50%,1)"});
    myAudio.volume = ui.value/100; 

    if(myAudio.volume == 0){
      $pp.css('background-color', 'red');
      $pp.text('Unmute');
    } else{
      $pp.css('background-color', 'inherit');
      $pp.text('Mute');
    }
  } 
});

/*

  Browser events

*/

$.getJSON( "/api/artists", function( data ) {
  var items = [];
  $.each( data, function( key, val ) {
    items.push( '<a class="list-group-item" data-type="artist" data-artist="' + val + '">' + val + "</a>" );
  });

  $( items.join( "" ) ).appendTo( "#base" );
});


$pp.click(function() {
  if( myAudio.volume > 0){
    lastVolume = myAudio.volume;
    myAudio.volume = 0;
    $pp.css('background-color', 'red');
    $pp.text('Unmute');
  } else{
    if(lastVolume == 0){
      myAudio.volume = 0.75;
    } else{
      myAudio.volume = lastVolume;
    }
    
    $pp.css('background-color', 'inherit');
    $pp.text('Mute');
  }
  
});

$('#message').on('click', function(){
  socket.emit('chat message', $('#m').val());
  $('#m').val('');
});

$('#signin').on('click', function(){
  socket.emit('authentication', {username : $("#userid").val(), password: $('#passwordinput').val() } );
});

$('button.seat-btn').on('click', function(){
  socket.emit('seat request');
});

$(document).on('click', '.list-group-item', function(){
  var jdata = {};
  var artist = $(this).data('artist');
  var album = $(this).data('album');
  var t = $(this).data('id')
  var type = $(this).data('type');
  var trackSelected = false;

  switch(type) {
      case 'artist':
        jdata.url = '/api/artist/' + artist;
        jdata.type = 'album'
        jdata.item = artist
        jdata.div = 'album-panel'
        $("#base-panel").hide();
      break;

      case 'album':
      console.log('enter album');
        jdata.url = '/api/artists/' + artist + '/album/' + album;
        jdata.type = 'track'
        jdata.item = album
        jdata.div = 'track-panel'
        $("#album-panel").hide();
      break

      case 'track':
        trackSelected = true;
      break;

  }
  

  if(trackSelected == false){
    var compile;
    $.getJSON( jdata.url, function( data ) {
      var items = '';
      $.each( data, function( key, val ) {

        if(jdata.type== 'album'){
          items += '<a class="list-group-item" data-type="' + jdata.type +
           '" data-artist="' + artist + '" data-album="' + val + '">' + val + "</a>";
        } else{
          items += '<a class="list-group-item" data-type="' + jdata.type + '" data-id="' + val._id + '">' + val.title + "</a>";
        }
        
      });

      compile = compilePanel(jdata.item, items, jdata.div);
      $( compile ).appendTo( ".left-window" );

    });
  } else{
    socket.emit('queue track', {trackID : t});
  }

});


$(document).on('click', '.clickable',function(){
  var effect = $(this).data('effect');
  var panel = $(this).closest('.panel')[effect]();
  if(panel[0].id == 'album-panel'){
    $("#base-panel").show();
  }

  if(panel[0].id == 'track-panel'){
    $("#album-panel").show();
  }
});



/*

  Event Listeners for audio element

*/


myAudio.addEventListener('timeupdate', progress, false);

myAudio.addEventListener('loadedmetadata', function(e){
  socket.emit('seek');
});

myAudio.addEventListener('canplaythrough', function(e){
  // Audio is ready, play it (seek needs to happen elsewhere);  
  myAudio.play();

});

myAudio.addEventListener('ended', function(e){
  socket.emit('end');
});

/*

  Socket Events

*/  

//  This triggers when we connect to socket.io server This is the start

socket.on('connect', function(){
  socket.emit('authentication');
});

socket.on('not authenticated', function(){
  $('#myModal').modal({ keyboad: false, backdrop: 'static' });
});

socket.on('seektimes', function(){
  socket.emit('seekReturn', { time: myAudio.currentTime} );
});

socket.on('setSeekTime', function(data){
  myAudio.currentTime = data.seek;
});

socket.on('song', function (data) {

  $('span.artist').text(data.meta.albumartist[0]);
  $('h2.song-title').text(data.meta.title);
  $('.meta').text(data.meta.album + ' - ' + data.meta.year);

  myAudio.src=(window.URL || window.webkitURL).createObjectURL( new Blob( [data.buffer] ) );
  myAudio.preload="";
  myAudio.volume = 0.0;

});


socket.on('chat message', function(msg){
  $('#messages').append($('<li>').text(msg.username + ': ' + msg.msg));
});

socket.on('authenticated', function(){

  socket.emit('connection'); // need to launch that when credentials have been accepted
  $('#myModal').modal('hide');

});

socket.on('too many connections', function(){
  console.log('respond with modal and explanation');
  $('#nonomodal').modal({ keyboad: false, backdrop: 'static' });
});

