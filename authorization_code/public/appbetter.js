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
  //$pp.text(getTime(AUDIO.currentTime) + '/' + totalTime);
}

$vol.slider( {
  value : myAudio.volume*100,
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


myAudio.addEventListener('timeupdate', progress, false);

myAudio.addEventListener('loadedmetadata', function(e){
  //emit('seek');
});

myAudio.addEventListener('canplaythrough', function(e){
  // Audio is ready, play it (seek needs to happen elsewhere);
  socket.emit('seek');
  myAudio.play();

});

myAudio.addEventListener('ended', function(e){
  //emit('songend');
});

socket.on('connect', function(){
  console.log('we have connected');
  socket.emit('connection');
});

socket.on('seektimes', function(){
  console.log('recieved a seek request');
  console.log(myAudio.currentTime);
  socket.emit('seekReturn', { time: myAudio.currentTime} );
});

socket.on('setSeekTime', function(data){
  console.log('set time for' + data.seek);
  myAudio.currentTime = data.seek;
});

socket.on('song', function (data) {

  myAudio.src=(window.URL || window.webkitURL).createObjectURL( new Blob( [data.buffer] ) );
  myAudio.preload="";
  myAudio.volume = 0.75;
  myAudio.play();

});