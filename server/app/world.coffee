box2d = require('./box2d-extended.coffee').box2d
Robot = require('./robot.coffee').Robot
CannonBall = require('./cannonball.coffee').CannonBall

TIMESTEP = 1.0 / 60.0 # s
COMMAND_FRAMES_PER_STEP = 60
SLOWDOWN_FRAMES_PER_STEP = 15
ARENA_WIDTH = 20.0 # m
ARENA_HEIGHT = 15.0 # m
GRAVITY = new box2d.b2Vec2(0.0, 0.0) # m/s^2
WALL_FRICTION = 0.2
WALL_RESTITUTION = 0.1
VELOCITY_ITERATIONS = 6
POSITION_ITERATIONS = 2

class exports.World
	_objects: []
	_world: null

	constructor: ->
		@_world = new box2d.b2World(GRAVITY)
		@_createWalls()

	getTimestep: -> TIMESTEP
	getFrame: -> {objects: _getObjectUpdate(object) for object in @_objects}
	getWorld: -> @_world

	createRobot: (playerId) ->
		position = new box2d.b2Vec2(Math.random() * ARENA_WIDTH,
		                            Math.random() * ARENA_HEIGHT)
		@_addObject(new Robot(playerId, @, position))

	createCannonBall: (shooter) -> @_addObject(new CannonBall(@, shooter))

	removeObject: (object) ->
		object.destroy()
		@_objects = (o for o in @_objects when o != object)

	runTurn: (numberOfSteps) ->
		[0...numberOfSteps].reduce((frames, stepNumber) =>
			object.onCommandStep(stepNumber) for object in @_objects
			frames = frames.concat(@_simulate(COMMAND_FRAMES_PER_STEP))
			object.onSlowdownStep(stepNumber) for object in @_objects
			frames.concat(@_simulate(SLOWDOWN_FRAMES_PER_STEP))
		, [])

	_addObject: (object) ->
		@_objects.push(object)
		object

	_createWalls: ->
		@_createWall(new box2d.b2Vec2(0.0, 0.0),
		            new box2d.b2Vec2(ARENA_WIDTH, 0.0))
		@_createWall(new box2d.b2Vec2(ARENA_WIDTH, 0.0),
		            new box2d.b2Vec2(ARENA_WIDTH, ARENA_HEIGHT))
		@_createWall(new box2d.b2Vec2(ARENA_WIDTH, ARENA_HEIGHT),
		            new box2d.b2Vec2(0.0, ARENA_HEIGHT))
		@_createWall(new box2d.b2Vec2(0.0, ARENA_HEIGHT),
		            new box2d.b2Vec2(0.0, 0.0))

	_createWall: (startPoint, endPoint) ->
		bodyDef = new box2d.b2BodyDef()
		bodyDef.set_type(box2d.b2_staticBody)
		body = @_world.CreateBody(bodyDef)

		shape = new box2d.b2EdgeShape()
		shape.Set(startPoint, endPoint)

		fixtureDef = new box2d.b2FixtureDef()
		fixtureDef.set_shape(shape)
		fixtureDef.set_friction(WALL_FRICTION)
		fixtureDef.set_restitution(WALL_RESTITUTION)
		body.CreateFixture(fixtureDef)

	_simulate: (numberOfFrames) ->
		for frame in [0...numberOfFrames]
			object.simulate() for object in @_objects
			@_world.Step(TIMESTEP, VELOCITY_ITERATIONS, POSITION_ITERATIONS)
			@getFrame()

	_getObjectUpdate = (object) ->
		{
			type: object.getType()
			playerId: object.getPlayerId()
			position: {
				x: object.getPosition().get_x()
				y: object.getPosition().get_y()
			}
			rotation: object.getRotation()
		}
