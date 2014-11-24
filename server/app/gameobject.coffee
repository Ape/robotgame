class exports.GameObject
	_id: null
	_world: null
	_body: null

	constructor: (@_id, @_world, @_body) ->
	destroy: -> @_world.getWorld().DestroyBody(@_body)
	getPosition: -> @_body.GetPosition()
	getVelocity: -> @_body.GetLinearVelocity()
	getRotation: -> @_body.GetAngle()
	getMass: -> @_body.GetMass()
	getInertia: -> @_body.GetInertia()

	getType: ->
	onCommandStep: (stepNumber) ->
	onSlowdownStep: ->
	simulate: ->
