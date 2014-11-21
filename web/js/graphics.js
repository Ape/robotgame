angular.module('graphics', ['model'])

.service('Graphics', function(Model) {
	var WINDOW_WIDTH = 800;
	var WINDOW_HEIGHT = 600;
	var ARENA_WIDTH = 20; // m
	var ARENA_HEIGHT = 15; // m

	var renderer;
	var stage;
	var texture;
	var sprites = [];

	this.init = function() {
		renderer = PIXI.autoDetectRenderer(WINDOW_WIDTH, WINDOW_HEIGHT);
		requestAnimFrame(render);

		stage = new PIXI.Stage(0xcccccc);

		PIXI.scaleModes.DEFAULT = PIXI.scaleModes.NEAREST;
		texture = PIXI.Texture.fromImage('image/robot.png');

		return renderer.view;
	};

	function render() {
		stage.removeChildren();

		if (Model.hasUpdate()) {
			var frame = getFrame(new Date() - Model.getUpdateTime());

			frame.robots.forEach(function(robot) {
				renderRobot(robot);
			});

			if (Model.hasStatus()) {
				var timeLeft = Math.max(Math.ceil((Model.getTimeout() - new Date()) / 1000), 1);
				var text = new PIXI.Text(timeLeft, {font: '50px Sans', fill: 'red'});
				stage.addChild(text);
			}
		}

		renderer.render(stage);
		requestAnimFrame(render);
	}

	function getFrame(timeElapsed) {
		var frames = Model.getFrames();
		var frameNumber = Math.min(Math.floor(timeElapsed / Model.getTimestep()), frames.length - 1);
		return frames[frameNumber];
	}

	function renderRobot(robot) {
		var sprite = getSprite(robot.id);
		sprite.position.x = robot.position.x * WINDOW_WIDTH / ARENA_WIDTH;
		sprite.position.y = robot.position.y * WINDOW_HEIGHT / ARENA_HEIGHT;
		sprite.rotation = robot.rotation;
		stage.addChild(sprite);
	}

	function getSprite(id) {
		var GOLDEN_ANGLE = 2.399963159042158;
		var COLOR_OFFSET = -1;

		while (sprites.length <= id) {
			var sprite = new PIXI.Sprite(texture);
			sprite.anchor.x = 0.5;
			sprite.anchor.y = 0.5;
			sprite.filters = [createHueFilter((id + COLOR_OFFSET) * GOLDEN_ANGLE)];
			sprites.push(sprite);
		}

		return sprites[id];
	}

	function createHueFilter(angle) {
		var LUMA_RED = 0.299;
		var LUMA_GREEN = 0.587;
		var LUMA_BLUE = 0.114;

		var filter = new PIXI.ColorMatrixFilter();

		var x = Math.cos(angle);
		var y = Math.sin(angle);

		filter.matrix = [
			((LUMA_RED + (x * (1 - LUMA_RED))) + (y * -(LUMA_RED))),
			((LUMA_GREEN + (x * -(LUMA_GREEN))) + (y * -(LUMA_GREEN))),
			((LUMA_BLUE + (x * -(LUMA_BLUE))) + (y * (1 - LUMA_BLUE))),
			0,

			((LUMA_RED + (x * -(LUMA_RED))) + (y * 0.143)),
			((LUMA_GREEN + (x * (1 - LUMA_GREEN))) + (y * 0.14)),
			((LUMA_BLUE + (x * -(LUMA_BLUE))) + (y * -0.283)),
			0,

			((LUMA_RED + (x * -(LUMA_RED))) + (y * -((1 - LUMA_RED)))),
			((LUMA_GREEN + (x * -(LUMA_GREEN))) + (y * LUMA_GREEN)),
			((LUMA_BLUE + (x * (1 - LUMA_BLUE))) + (y * LUMA_BLUE)),
			0,

			0, 0, 0, 1,
		];

		return filter;
	}
})
