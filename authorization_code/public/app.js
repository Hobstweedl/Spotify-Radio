 // Connect to Binary.js server
    var audioCtx = new AudioContext();
    var myAudio = document.querySelector('audio');
    var source = audioCtx.createMediaElementSource(myAudio);

    var client = new BinaryClient('ws://localhost:9000');

    var $pp  = $('#playpause'),
    $vol = $('#volume'),
    $bar = $("#progressbar"),
    AUDIO= myAudio;
    var totalTime;
    var lastVolume = 0;
    AUDIO.volume = 0.75;

    function getTime(t) {
      var m=~~(t/60), s=~~(t % 60);
      return (m<10?"0"+m:m)+':'+(s<10?"0"+s:s);
    }
    
    function progress() {
      $bar.slider('value', ~~(100/AUDIO.duration*AUDIO.currentTime));
      $pp.text(getTime(AUDIO.currentTime) + '/' + totalTime);
    }

    /*
      | Emit

      Will create a stream and send json string in the meta. Stream is empty
      Since this is using the client.send command, a new stream is created

      Stream may have to be killed in the Stream:end event

    */

    function emit(action, time) {
      var data = {};
      data["event"] = action;
      data["time"] = time;
      return client.send({}, JSON.stringify(data) );
    }
    
    

    $vol.slider( {
      value : AUDIO.volume*100,
      slide : function(ev, ui) {
        $vol.css({background:"hsla(180,"+ui.value+"%,50%,1)"});
        AUDIO.volume = ui.value/100; 
      } 
    });
     
    $bar.slider( {
      value : AUDIO.currentTime,
      slide : function(ev, ui) {
        AUDIO.currentTime = AUDIO.duration/100*ui.value;
      }
    });
    
    $pp.click(function() {
      if( AUDIO.volume > 0){
        lastVolume = AUDIO.volume;
        AUDIO.volume = 0;
      } else{
        AUDIO.volume = lastVolume;
      }
      
    });

    /*

    Event Listeners

    */

    myAudio.addEventListener('timeupdate', progress, false);

    myAudio.addEventListener('loadedmetadata', function(e){
      var t = myAudio.duration / 60;
      var m = Math.floor(t) ;
      var s = Math.floor( (t % 1) * 60);
      totalTime = m + ':' + s;
    });

    myAudio.addEventListener('canplay', function(e){
      // Audio is ready, ask the server for the time to go to
      emit('seek');
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

          if(meta == 'playsong'){
            console.log('play song');
            console.log(data);
          } else{
            console.log('loading data');
            parts.push(data);
          }
          
        });

        stream.on('end', function(){

          myAudio.src=(window.URL || window.webkitURL).createObjectURL(new Blob(parts));
          myAudio.preload="";        

          source.connect( audioCtx.destination );
          myAudio.volume = 0.0;

          stream.destroy();
          
        });

       


    });