box2d = require('./box2d-extended.coffee').box2d
GameObject = require('./gameobject.coffee').GameObject

LIFETIME = 3 # steps
SHOOT_OFFSET = 0.7 # m
RADIUS = 0.2 # m
SPEED = 15.0 # m/s
DENSITY = 12.0 # kg/m^2
FRICTION = 0.2
RESTITUTION = 0.1

class exports.CannonBall extends GameObject
	_lifetime: null

	constructor: (id, world, shooter) ->
		super(id, world, _createBody(world, shooter))
		@_lifetime = LIFETIME

	getType: -> 'cannonball'

	onSlowdownStep: ->
		@_lifetime--
		@_world.removeObject(@_id) if @_lifetime <= 0

	_createBody = (world, shooter) ->
		position = shooter.getPosition().copy()
				.add(new box2d.b2Vec2(0.0, SHOOT_OFFSET).rotate(shooter.getRotation()))
		velocity = shooter.getVelocity().copy()
				.add(new box2d.b2Vec2(0.0, SPEED).rotate(shooter.getRotation()))

		bodyDef = new box2d.b2BodyDef()
		bodyDef.set_type(box2d.b2_dynamicBody)
		bodyDef.set_position(position)
		bodyDef.set_linearVelocity(velocity)
		body = world.getWorld().CreateBody(bodyDef)

		shape = new box2d.b2CircleShape()
		shape.set_m_radius(RADIUS)

		fixtureDef = new box2d.b2FixtureDef()
		fixtureDef.set_shape(shape)
		fixtureDef.set_density(DENSITY)
		fixtureDef.set_friction(FRICTION)
		fixtureDef.set_restitution(RESTITUTION)
		body.CreateFixture(fixtureDef)

		body
