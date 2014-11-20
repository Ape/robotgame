var box2d = require('./lib/box2d.js');

exports.box2d = box2d;

box2d.b2Vec2.prototype.rotate = function(angle) {
	var length = this.Length();
	var newAngle = Math.atan2(this.get_x(), this.get_y()) + angle;
	this.Set(Math.cos(newAngle) * length, Math.sin(newAngle) * length);

	return this;
}
