http = require('http')
io = require('socket.io')(http, {serveClient: false})
utils = require('./utils.coffee')
World = require('./world.coffee').World

TURN_TIMEOUT = 10 # s
STEPS_PER_TURN = 4

class exports.Game
	_players: {}
	_nextPlayerId: 0
	_world: null
	_turnTimeout: null

	constructor: (port) ->
		@_world = new World()
		@_listen(port)

	_listen: (port) ->
		io.listen(port)
		io.on('connection', (socket) =>
			console.log("Player from #{socket.handshake.address} connected.")
			[player, playerId] = @_addPlayer(socket)
			@_sendInitialUpdate(socket)

			socket.on('disconnect', =>
				console.log("Player from #{socket.handshake.address} disconnected.")
				@_world.removeObject(player.robotId)
				delete @_players[playerId]
				@_checkTurnEnd()
			)

			socket.on('commands', (commands) =>
				player.ready = commands.ready
				@_world.getObject(player.robotId).setCommands(commands.commands)
				@_checkTurnEnd()
			)
		)

	_addPlayer: (socket) ->
		player = {
			socket: socket
			robotId: @_world.createRobot()
			ready: false
		}

		id = @_nextPlayerId++
		@_players[id] = player

		@_world.getObject(player.robotId)
				.setCommands('stop' for i in [0...STEPS_PER_TURN])

		[player, id]

	_sendInitialUpdate: (socket) ->
		update = @_createUpdate([@_world.getFrame()])
		socket.emit('update', update)

	_checkTurnEnd: ->
		if Object.keys(@_players).length > 0
			notReady = (player for id, player of @_players when not player.ready).length

			if notReady == 0
				@_update()
			else
				if notReady == Object.keys(@_players).length
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

	_update: ->
		@_stopTurnTimeout()
		for id, player of @_players
			player.ready = false

		frames = @_world.runTurn(STEPS_PER_TURN)
		for id, player of @_players
			player.socket.emit('update', @_createUpdate(frames))

	_createUpdate: (frames) ->
		{
			stepsPerTurn: STEPS_PER_TURN
			timestep: 1000 * @_world.getTimestep()
			frames: frames
		}
