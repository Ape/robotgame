var Game = require('./game.js').Game;

var port = process.env.PORT || 33668;

var game = new Game(port);
