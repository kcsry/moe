var gulp = require("gulp");
var concat = require("gulp-concat");
var uglify = require("gulp-uglifyjs");
var plumber = require("gulp-plumber");
var eslint = require("gulp-eslint");
var babel = require('gulp-babel');
var autoprefixer = require('gulp-autoprefixer');
var nano = require('gulp-cssnano');
var size = require('gulp-size');

var DEST_DIR = process.env.DEST_DIR || "dist/";

gulp.task("js", function() {
    gulp.src([
        "./src/mithril-custom.js",
        "./src/ajax.js",
        "./src/kit.js",
        "./src/app.js"
    ])
        .pipe(plumber())
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(concat("moe.js"))
        .pipe(babel())
        .pipe(uglify({
            enclose: {window: "window"}
        }))
        .pipe(size())
        .pipe(gulp.dest(DEST_DIR))
        .pipe(eslint.failOnError());
});

gulp.task("css", function() {
    gulp.src([
        "./src/moe.css",
    ])
        .pipe(plumber())
        .pipe(concat("moe.css"))
        .pipe(autoprefixer(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        })))
        .pipe(nano())
        .pipe(gulp.dest(DEST_DIR));
});

gulp.task("watch", ["js", "css"], function() {
    gulp.watch("./src/*.js", ["js"]);
    gulp.watch("./src/moe.css", ["css"]);
});

gulp.task("default", ["js", "css"]);