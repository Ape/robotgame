var box2d = require('box2d.js').Box2D;

exports.box2d = box2d;

box2d.b2Vec2.prototype.rotate = function(angle) {
	var length = this.Length();
	var newAngle = Math.atan2(this.get_y(), this.get_x()) + angle;
	this.Set(Math.cos(newAngle) * length, Math.sin(newAngle) * length);
	return this;
};

box2d.b2Vec2.prototype.abs = function() {
	this.Set(Math.abs(this.get_x()), Math.abs(this.get_y()));
	return this;
};

box2d.b2Vec2.prototype.mul = function(vector) {
	this.Set(this.get_x() * vector.get_x(), this.get_y() * vector.get_y());
	return this;
};

box2d.b2Vec2.prototype.scalarMul = function(scalar) {
	this.Set(this.get_x() * scalar, this.get_y() * scalar);
	return this;
};

box2d.b2Vec2.prototype.copy = function() {
	return new box2d.b2Vec2(this.get_x(), this.get_y());
};

box2d.b2Vec2.prototype.toString = function() {
	return "(" + this.get_x() + ", " + this.get_y() + ")";
};
