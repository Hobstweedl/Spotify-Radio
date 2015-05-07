var url = require('url');

function start(server, route, handle){
    
    function contentRequest(req, res){
        var path = url.parse( req.url);
        console.log('Request for ' + path.pathname + ' received');

        route(path.pathname, handle, res);
    }

    server.createServer( contentRequest ).listen(3000);
    console.log('Server running at http://localhost:3000/');
    console.log('------ Server Start ------\n')
}

exports.start = start;