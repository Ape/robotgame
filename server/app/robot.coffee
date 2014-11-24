utils = require('./utils.coffee')
box2d = require('./box2d-extended.coffee').box2d
GameObject = require('./gameobject.coffee').GameObject

SIZE = 1.0 # m
DENSITY = 5.0 # kg/m^2
FRICTION = 0.2
RESTITUTION = 0.1
SPEED = 2.0 # m/s
SPEED_REVERSE = 1.0 # m/s
ANGULAR_SPEED = Math.PI / 2 # radians/s
LATERAL_FRICTION = 10.0
CANNON_LINEAR_RECOIL = 0.2 # m/s
CANNON_ANGULAR_RECOIL = 0.2 # radians/s

class exports.Robot extends GameObject
	_commands: []

	constructor: (id, world, position) ->
		super(id, world, _createBody(world, position))

	getType: -> 'robot'

	setCommands: (commands) ->
		@_commands = commands

	onCommandStep: (stepNumber) ->
		@_executeCommand(@_commands[stepNumber])

	onSlowdownStep: ->
		angularImpulse = -utils.limitValue(@_body.GetAngularVelocity(),
		                                   -ANGULAR_SPEED, ANGULAR_SPEED)

		@_applyImpulse(-@_getRelativeVelocity().get_y())
		@_applyAngularImpulse(angularImpulse)

	simulate: -> @_applyFriction()

	_executeCommand: (command) ->
		switch command
			when 'forward' then @_applyImpulse(SPEED)
			when 'reverse' then @_applyImpulse(-SPEED_REVERSE)
			when 'turnleft' then @_applyAngularImpulse(-ANGULAR_SPEED)
			when 'turnright' then @_applyAngularImpulse(ANGULAR_SPEED)
			when 'turnleftslow' then @_applyAngularImpulse(-ANGULAR_SPEED / 2)
			when 'turnrightslow' then @_applyAngularImpulse(ANGULAR_SPEED / 2)
			when 'shootcannon' then @_shootCannon()

	_getRelativeVelocity: ->
		@getVelocity().copy().rotate(-@getRotation())

	_applyImpulse: (speed) ->
		impulse = new box2d.b2Vec2(0.0, speed * @getMass())
				.rotate(@getRotation())
		@_body.ApplyLinearImpulse(impulse, @getPosition())

	_applyAngularImpulse: (angularSpeed) ->
		@_body.ApplyAngularImpulse(angularSpeed * @getInertia())

	_applyFriction: ->
		frictionalForce = @_getRelativeVelocity().copy()
				.mul(new box2d.b2Vec2(-LATERAL_FRICTION, 0))
				.rotate(@getRotation())

		@_body.ApplyForceToCenter(frictionalForce)

	_shootCannon: ->
		@_world.createCannonBall(@)
		@_applyImpulse(-CANNON_LINEAR_RECOIL)
		@_applyAngularImpulse((2 * Math.random() - 1) * CANNON_ANGULAR_RECOIL)

	_createBody = (world, position) ->
		bodyDef = new box2d.b2BodyDef()
		bodyDef.set_type(box2d.b2_dynamicBody)
		bodyDef.set_position(position)
		bodyDef.set_angle(Math.random() * 2.0 * Math.PI)
		body = world.getWorld().CreateBody(bodyDef)

		shape = new box2d.b2PolygonShape()
		shape.SetAsBox(SIZE / 2, SIZE / 2)

		fixtureDef = new box2d.b2FixtureDef()
		fixtureDef.set_shape(shape)
		fixtureDef.set_density(DENSITY)
		fixtureDef.set_friction(FRICTION)
		fixtureDef.set_restitution(RESTITUTION)
		body.CreateFixture(fixtureDef)

		body
