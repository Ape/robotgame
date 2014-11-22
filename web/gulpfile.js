var gulp = require('gulp');
var replace = require('gulp-replace-task');
var ngAnnotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');

var target = 'build';

gulp.task('config', function() {
	return gulp.src('config.js')
		.pipe(replace({patterns: [{
			match: 'SERVER_ADDRESS',
			replacement: process.env.SERVER_ADDRESS || 'http://localhost:33668/'
		}]}))
		.pipe(gulp.dest(target));
});

gulp.task('scripts', ['config'], function() {
	var sources = [
		'node_modules/angular/angular.js',
		'node_modules/pixi.js/bin/pixi.dev.js',
		'node_modules/socket.io-client/socket.io.js',
		'app/**/*.js',
		'build/config.js',
	];

	return gulp.src(sources)
		.pipe(ngAnnotate())
		.pipe(uglify())
		.pipe(concat('all.min.js'))
		.pipe(gulp.dest(target));
});

gulp.task('default', ['scripts']);
