var router = module.exports = {    

    //  Store our caught routes
    handlers : [],

    send : function(content){
        console.log('The following is the content to send');
        console.log(content);
    },

    route : function(path, response){
        var length = this.handlers.length;
        var handle;

        //  Loop through each item in the handler and find the first match
        for( var i = 0; i < length; i++ ){
            handle = this.handlers[i];
            console.log('Found match?');
            console.log(handle.path + ' <--- handler - path ---> ' + path + '\n');
            if(handle.path == path){
                console.log('Found match');
                console.log( handle.cb.toString() );
                response.writeHead(200, {"Content-Type" : "text/plain"} );
                handle.cb;
            }
        }

        response.end();
    },

    //  Add the specified routes to the handler and wait for further instruction
    get : function(url, fn){
        this.handlers.push({
            path : url,
            cb : fn
        });

        console.log('\n');
        console.log('The route ' + url + ' was stored\n');
    }
}