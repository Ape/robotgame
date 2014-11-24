box2d = require('box2d.js').Box2D

exports.box2d = box2d

box2d.b2Vec2.prototype.add = (vector) ->
	this.Set(this.get_x() + vector.get_x(), this.get_y() + vector.get_y())
	this

box2d.b2Vec2.prototype.sub = (vector) ->
	this.Set(this.get_x() - vector.get_x(), this.get_y() - vector.get_y())
	this

box2d.b2Vec2.prototype.rotate = (angle) ->
	length = this.Length()
	newAngle = Math.atan2(this.get_y(), this.get_x()) + angle
	this.Set(Math.cos(newAngle) * length, Math.sin(newAngle) * length)
	this

box2d.b2Vec2.prototype.abs = ->
	this.Set(Math.abs(this.get_x()), Math.abs(this.get_y()))
	this

box2d.b2Vec2.prototype.mul = (vector) ->
	this.Set(this.get_x() * vector.get_x(), this.get_y() * vector.get_y())
	this

box2d.b2Vec2.prototype.scalarMul = (scalar) ->
	this.Set(this.get_x() * scalar, this.get_y() * scalar)
	this

box2d.b2Vec2.prototype.copy = ->
	new box2d.b2Vec2(this.get_x(), this.get_y())

box2d.b2Vec2.prototype.toString = ->
	"(#{this.get_x()}, #{this.get_y()})"
