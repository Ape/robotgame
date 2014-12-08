http = require('http')
io = require('socket.io')(http, {serveClient: false})
utils = require('./utils.coffee')
World = require('./world.coffee').World

TURN_TIMEOUT = 10 # s
STEPS_PER_TURN = 4

class exports.Game
	_players: []
	_world: null
	_turnTimeout: null

	constructor: (port) ->
		@_world = new World()
		@_listen(port)

	_listen: (port) ->
		io.listen(port)
		io.on('connection', (socket) =>
			console.log("Player from #{socket.handshake.address} connected.")
			player = @_addPlayer(socket)
			@_sendInitialUpdate(socket)

			socket.on('disconnect', =>
				console.log("Player from #{socket.handshake.address} disconnected.")
				@_world.removeObject(player.robot)
				@_players = @_players.filter((p) -> p != player)
				@_checkTurnEnd()
			)

			socket.on('commands', (commands) =>
				player.ready = commands.ready
				player.robot.setCommands(commands.commands)
				@_checkTurnEnd()
			)
		)

	_addPlayer: (socket) ->
		id = @_getNextPlayerId()
		player = {
			id: id
			socket: socket
			robot: @_world.createRobot(id, STEPS_PER_TURN)
			ready: false
		}
		@_players.push(player)
		player

	_getNextPlayerId: ->
		id = 0
		id++ until (player for player in @_players when player.id == id).length == 0
		id

	_sendInitialUpdate: (socket) ->
		update = @_createUpdate([@_world.getFrame()])
		socket.emit('update', update)

	_checkTurnEnd: ->
		if @_players.length > 0
			notReady = (player for player in @_players when not player.ready).length

			if notReady == 0
				@_update()
			else
				if notReady == @_players.length
					@_stopTurnTimeout()
				else
					@_turnTimeout ?= setTimeout(@_update, TURN_TIMEOUT * 1000)

				io.sockets.emit('status', {
					timeout: @_getTurnTimeoutRemaining()
					notReady: notReady
				})

	_stopTurnTimeout: ->
		clearTimeout(@_turnTimeout)
		@_turnTimeout = null

	_getTurnTimeoutRemaining: ->
		if @_turnTimeout?
			Math.ceil(utils.timeoutRemaining(@_turnTimeout) / 1000)
		else
			null

	_update: =>
		@_stopTurnTimeout()
		player.ready = false for player in @_players

		frames = @_world.runTurn(STEPS_PER_TURN)
		for player in @_players
			player.socket.emit('update', @_createUpdate(frames))

	_createUpdate: (frames) ->
		{
			stepsPerTurn: STEPS_PER_TURN
			timestep: 1000 * @_world.getTimestep()
			frames: frames
		}
