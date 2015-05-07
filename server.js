var url = require('url');

function start(server, router){
    
    function contentRequest(req, res){
        var path = url.parse( req.url );
        console.log('Request for ' + path.pathname + ' received');
        router.route( path.pathname.substr(1), res);
    }

    server.createServer( contentRequest ).listen(3000);
    console.log('Server running at http://localhost:3000/');
    console.log('------ Server Start ------\n')
}

exports.start = start;