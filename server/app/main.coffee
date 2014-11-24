Game = require('./game.coffee').Game

port = process.env.PORT or 33668

game = new Game(port)
