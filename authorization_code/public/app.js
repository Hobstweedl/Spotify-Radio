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
    AUDIO.addEventListener("timeupdate", progress, false);
    
    

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

    function getTime(t) {
      var m=~~(t/60), s=~~(t % 60);
      return (m<10?"0"+m:m)+':'+(s<10?"0"+s:s);
    }
    
    function progress() {
      $bar.slider('value', ~~(100/AUDIO.duration*AUDIO.currentTime));
      $pp.text(getTime(AUDIO.currentTime) + '/' + totalTime);
    }

    myAudio.addEventListener('timeupdate', progress, false);

    myAudio.addEventListener('loadedmetadata', function(e){
      var t = myAudio.duration / 60;
      var m = Math.floor(t) ;
      var s = Math.ceil( (t % 1) * 60);
      totalTime = m + ':' + s;
    })
   

    // Received new stream from server!
    client.on('stream', function(stream, meta){    
        var parts = [];

        stream.on('data', function(data){
          console.log('loading data');
          parts.push(data);
        });

        stream.on('end', function(){

          myAudio.src=(window.URL || window.webkitURL).createObjectURL(new Blob(parts));
          myAudio.preload="";        

          source.connect( audioCtx.destination );
          myAudio.volume = 0.75;

          
  
          myAudio.play();
        });
    });