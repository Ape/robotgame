exports.GameObject = function(world, body) {
	var self = this;
	self._world = world;
	self._body = body;

	self.destroy = function() {
		self._world.getWorld().DestroyBody(self._body);
	};

	self.getPosition = function() {
		return self._body.GetPosition();
	};

	self.getVelocity = function() {
		return self._body.GetLinearVelocity();
	};

	self.getRotation = function() {
		return self._body.GetAngle();
	};

	self.getMass = function() {
		return self._body.GetMass();
	};

	self.getInertia = function() {
		return self._body.GetInertia();
	};

	self.getType = function() {};
	self.onCommandStep = function(stepNumber) {};
	self.onSlowdownStep = function() {};
	self.simulate = function() {};
};
