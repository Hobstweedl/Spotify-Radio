var socket = io('http://localhost:3000');
var audioCtx = new AudioContext();
var myAudio = document.querySelector('audio');
var source = audioCtx.createMediaElementSource(myAudio);
source.connect( audioCtx.destination );

var $pp  = $('#playpause'),
$vol = $('#volume');
var lastVolume = 0;

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

$('#signin').on('click', function(){
  socket.emit('authentication', {username : $("#userid").val(), password: $('#passwordinput').val() } );
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


socket.on('authenticated', function(){

  socket.emit('connection'); // need to launch that when credentials have been accepted
  $('#myModal').modal('hide');

});

socket.on('too many connections', function(){
  console.log('respond with modal and explanation');
  $('#nonomodal').modal({ keyboad: false, backdrop: 'static' });
});

