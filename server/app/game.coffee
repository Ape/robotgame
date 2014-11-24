_ = require('lodash')
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
				.setCommands(_.range(STEPS_PER_TURN).map(-> 'stop'))

		[player, id]

	_sendInitialUpdate: (socket) ->
		update = @_createUpdate([@_world.getFrame()])
		socket.emit('update', update)

	_checkTurnEnd: ->
		if _.size(@_players) > 0
			notReady = _.where(@_players, {'ready': false}).length

			if notReady == 0
				@_update()
			else
				if notReady == _.size(@_players)
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
		_.forEach(@_players, (player) ->
			player.ready = false
			true
		)

		frames = @_world.runTurn(STEPS_PER_TURN)
		_.forEach(@_players, (player) =>
			player.socket.emit('update', @_createUpdate(frames))
		)

	_createUpdate: (frames) ->
		{
			stepsPerTurn: STEPS_PER_TURN
			timestep: 1000 * @_world.getTimestep()
			frames: frames
		}
