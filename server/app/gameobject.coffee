class exports.GameObject
	_playerId: null
	_world: null
	_body: null

	constructor: (@_playerId, @_world, @_body) ->
	destroy: -> @_world.getWorld().DestroyBody(@_body)
	getPlayerId: -> @_playerId
	getPosition: -> @_body.GetPosition()
	getVelocity: -> @_body.GetLinearVelocity()
	getRotation: -> @_body.GetAngle()
	getMass: -> @_body.GetMass()
	getInertia: -> @_body.GetInertia()

	getType: ->
	simulate: ->
	onCommandStep: (stepNumber) ->
	onSlowdownStep: ->
