var router = module.exports = {    

    //  Store our caught routes
    handlers : [],

    data : '',

    send : function(content){
        this.data = content;
    },

    route : function(path, response){
        var length = this.handlers.length;
        var handle;
        var index = 0;

        while( index < length){
            handle = this.handlers[ index ];

            if(handle.path == path){
                response.writeHead(200, {"Content-Type" : "text/plain"} );

                if( typeof(handle.cb) === "function" ){
                    //  Function
                    handle.cb();
                } else{
                    //  Not a function, determine type and execute
                }
                index = length;
                break;
            }
            index++;
        }
        
        response.write( this.data );
        this.data = '';
        console.log('Closing response');
        response.end();
    },

    //  Add the specified routes to the handler and wait for further instruction
    get : function(url, fn){
        this.handlers.push({
            path : url,
            cb : fn
        });
    }
}