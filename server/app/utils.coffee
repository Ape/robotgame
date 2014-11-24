exports.limitValue = (value, min, max) ->
	Math.max(min, Math.min(max, value))

exports.timeoutRemaining = (timeout) ->
	timeout._idleStart + timeout._idleTimeout - Date.now()
