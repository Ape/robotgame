exports.limitValue = function(value, min, max) {
	return Math.max(min, Math.min(max, value));
};

exports.timeoutRemaining = function(timeout) {
	return (timeout._idleStart + timeout._idleTimeout - Date.now());
};
