 // Connect to Binary.js server
    var audioCtx = new AudioContext();
    var myAudio = document.querySelector('audio');
    var source = audioCtx.createMediaElementSource(myAudio);

    var client = new BinaryClient('ws://localhost:9000');

    var $pp  = $('#playpause'),
    $vol = $('#volume'),
    AUDIO= myAudio;
    var totalTime;
    var lastVolume = 0;
    AUDIO.volume = 0.75;

    $('.seat-btn').on('click', function(){
      var seat = $(this).attr('id');
      console.log('clicked seat' + seat);
      emit('seat', 0, seat );
    });

    function getTime(t) {
      var m=~~(t/60), s=~~(t % 60);
      return (m<10?"0"+m:m)+':'+(s<10?"0"+s:s);
    }
    
    function progress() {
      var p = 100/AUDIO.duration*AUDIO.currentTime;
      $('.progress-bar').css('width', p+'%');
      $('.time').text(getTime(AUDIO.currentTime) );
      //$pp.text(getTime(AUDIO.currentTime) + '/' + totalTime);
    }

    /*
      | Emit

      Will create a stream and send json string in the meta. Stream is empty
      Since this is using the client.send command, a new stream is created

      Stream may have to be killed in the Stream:end event

    */

    function emit(action, time, seat) {
      var data = {};
      data["event"] = action;
      data["time"] = time;
      data["seat"] = seat;
      return client.send({}, JSON.stringify(data) );
    }
    
    

    $vol.slider( {
      value : AUDIO.volume*100,
      animate: "fast",
      slide : function(ev, ui) {
        $vol.css({background:"hsla(180,"+ui.value+"%,50%,1)"});
        AUDIO.volume = ui.value/100; 

        if(AUDIO.volume == 0){
          $pp.css('background-color', 'red');
          $pp.text('Unmute');
        } else{
          $pp.css('background-color', 'inherit');
          $pp.text('Mute');
        }
      } 
    });
    
    $pp.click(function() {
      if( AUDIO.volume > 0){
        lastVolume = AUDIO.volume;
        AUDIO.volume = 0;
        $pp.css('background-color', 'red');
        $pp.text('Unmute');
      } else{
        if(lastVolume == 0){
          AUDIO.volume = 0.75;
        } else{
          AUDIO.volume = lastVolume;
        }
        
        $pp.css('background-color', 'inherit');
        $pp.text('Mute');
      }
      
    });

    /*

    Event Listeners

    */

    //emit('seek');
    //  seek needs to happen when file has finished loading, but not in canplay event

    myAudio.addEventListener('timeupdate', progress, false);

    myAudio.addEventListener('loadedmetadata', function(e){
      var t = myAudio.duration / 60;
      var m = Math.floor(t) ;
      var s = Math.floor( (t % 1) * 60);
      totalTime = m + ':' + s;
      emit('seek');
    });

    myAudio.addEventListener('canplaythrough', function(e){
      // Audio is ready, play it (seek needs to happen elsewhere);
      myAudio.play();
    });

    myAudio.addEventListener('ended', function(e){
      emit('songend');
    });


    client.on('open', function(s,m){
      console.log('connection established');
      emit('startsong');
    });

    /*

    Client and Stream events

    */

    // Received new stream from server!
    client.on('stream', function(stream, meta){  

        var parts = [];

        if(meta == 'seek'){
          console.log('I am returning my seektime');
          emit('seekReturn', myAudio.currentTime);
        }

        stream.on('data', function(data){

          if(meta == 'setseektime'){
            myAudio.currentTime = data;
          } else{
            console.log('loading data');
            parts.push(data);
          }
        });

        stream.on('end', function(){

          myAudio.src=(window.URL || window.webkitURL).createObjectURL(new Blob(parts));
          myAudio.preload="";        
          source.connect( audioCtx.destination );
          myAudio.volume = 0.75;
          stream.destroy();
          
        });

       


    });