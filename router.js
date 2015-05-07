var handlers = [];
function route(path, handle, response){

    if( typeof handle[path] === 'function'){
        response.writeHead(200, {"Content-Type" : "text/plain"} );
        handle[path](response);
    } else{
        console.log('No Handle Found For ' + path);
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not found");
    }

    response.end();
}

function get(url, fn){
    this.handlers.push({ path: url, cb: fn});
}

exports.route = route;