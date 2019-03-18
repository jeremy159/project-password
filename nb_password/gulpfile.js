'use strict';

var gulp = require('gulp');
var watch = require('gulp-watch');
var browserSync = require('browser-sync').create();

/**
 * Web Server Task
 * --------------
 * Starts a web server to host the files. Default port is 3000
 * ui available at port 3001
 */
gulp.task('serve', function() {

  // Serve files from the root of this project
  browserSync.init({
    server: {
        baseDir: "./"
    },

    notify: false // Don't show any notifications in the browser.
  });

  return watch("assets/**/*.js", function() {
    browserSync.reload();
  });
});

/**
 * Default Task
 * ------------
 * Starts the webserver.
 */
gulp.task('default', ['serve']);
