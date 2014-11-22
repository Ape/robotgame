angular.module('directives', [])

.directive('appendElement', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			scope.$watch(attrs.appendElement, function(value) {
				element.append(value);
			});
		},
	};
});
