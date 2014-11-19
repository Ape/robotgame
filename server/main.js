var PORT = 33668;
var WINDOW_WIDTH = 800;
var WINDOW_HEIGHT = 600;

var http = require('http')
var io = require('socket.io')(http, { serveClient: false });

io.listen(PORT);

var state = {
	'position': {
		'x': 0,
		'y': 0,
	}
}

io.on('connection', function(socket) {
	socket.emit('update', state);
});

setInterval(function() {
	state.position.x = Math.random() * WINDOW_WIDTH;
	state.position.y = Math.random() * WINDOW_HEIGHT;

	io.sockets.emit('update', state);
}, 1000);
