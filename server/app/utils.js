exports.limitValue = function(value, min, max) {
	return Math.max(min, Math.min(max, value));
};

exports.tableLength = function(table) {
	return Object.keys(table).length;
};

exports.tableForEach = function(table, action) {
	for (var key in table) {
		action(table[key], key);
	}
};

exports.timeoutRemaining = function(timeout) {
	return (timeout._idleStart + timeout._idleTimeout - Date.now());
};
