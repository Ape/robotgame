var gulp = require('gulp');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

var sources = [
	'app/**/*.js',
	'node_modules/angular/angular.js',
	'node_modules/pixi.js/bin/pixi.js',
	'node_modules/socket.io-client/socket.io.js',
];

gulp.task('scripts', function() {
	return gulp.src(sources)
		.pipe(ngAnnotate())
		.pipe(uglify())
		.pipe(concat('all.min.js'))
		.pipe(gulp.dest('build'));
});

gulp.task('default', ['scripts']);
