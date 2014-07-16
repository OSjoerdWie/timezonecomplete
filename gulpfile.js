var gulp = require("gulp");
var browserify = require("gulp-browserify");
var gulpFilter = require("gulp-filter");
var debug = require("gulp-debug");
var rename = require("gulp-rename");
var typescript = require("gulp-tsc");
var wrapUmd = require("gulp-wrap-umd");
var typedoc = require("gulp-typedoc");
var clean = require("gulp-clean");
var dtsBundle = require("dts-bundle");
var fs = require("fs");
var runSequence = require("run-sequence");
var replace = require("gulp-replace");

///////////////////////////////////////////////////////////////////////////////
// Overall tasks
///////////////////////////////////////////////////////////////////////////////

const MODULE_NAME="timezonecomplete";

// Nice help message
gulp.task("help", function(cb) {
	console.log("Build system for Spirit IT " + MODULE_NAME);
	console.log("");
	console.log("BUILD COMMANDS:");
	console.log("");
	console.log("gulp                 Build all");
	console.log("gulp clean           Clean build output");
	console.log("gulp build           Build");
	console.log("gulp rebuild         Clean and Build");
	console.log("gulp doc             Create documentation");
	console.log("gulp help            This help message");
	console.log("gulp browser_package Create browser package");
	console.log("gulp bundle          Make a bundled timezonecomplete.d.ts file");
	console.log("gulp release         All of the above");
	console.log("gulp rerelease       Clean and All of the above");
  
	console.log("");
	cb(); // signal end-of-task
});

// Default task: this is called when just typing "gulp" on command line
gulp.task("default", ["build"]);

gulp.task("rebuild", function(cb) {
  runSequence("clean", "build", cb);
});

gulp.task("rerelease", function(cb) {
  runSequence("clean", "release", cb);
});

gulp.task("clean", function() {
	gulp
		.src([
			"dist/",
			"gulp-tsc*/",
			"lib/**/*.d.ts",
			"lib/**/*.js",
			"lib/**/*.map",
			"test/**/*.d.ts",
			"test/**/*.js",
			"test/**/*.map",
			"examples/**/*.d.ts",
			"examples/**/*.js",
			"examples/**/*.map",
      "doc/"
		], { read: false, base: "." })
		.pipe(clean({force: true}))
		.on("error", trapError) // make exit code non-zero
})

// workaround for gulp-tsc creating faulty references in .d.ts files
gulp.task("fix_refs", ["build"], function() {
  return gulp
    .src("lib/index.d.ts", { base: "." })
    .pipe(replace("/// <reference path=\"../../typings/lib.d.ts\" />", "/// <reference path=\"../typings/lib.d.ts\" />"))
    .pipe(gulp.dest("."));
});

gulp.task("bundle", ["build", "fix_refs"], function() {
	dtsBundle.bundle({
		name: 'timezonecomplete',
	    main: 'lib/index.d.ts',
		baseDir: './lib',
		externals: false,
	});
})

gulp.task("doc", function() {
	return gulp.src(["lib/**.ts"], {base: "."})
		.pipe(gulpFilter("!**/*.d.ts"))
		.pipe(typedoc({
			module: "commonjs",
			out: "./doc",
			name: "timezonecomplete",
			target: "es5",
			excludeExternals: "",
		}))
		.on("error", trapError);
});

gulp.task("build", function() {
	 return gulp.src([
			"**/*.ts",
		], {base: "."})
		.pipe(gulpFilter("!**/*.d.ts"))
		.pipe(typescript({
			module: "commonjs",
			declaration: true,
			target: "es5",
		}))
		.pipe(gulp.dest("."))
		.on("error", trapError); // make exit code non-zero
	});


gulp.task("release", ["build", "browser_package", "doc", "bundle"]);

gulp.task("browser_package", ["build"], function() {
	return browserifyTask("timezonecomplete");
})

function browserifyTask(packageName) {
	var template = fs.readFileSync("./umd-template/umd-require.jst");
	return gulp.src("lib/index.js", {base: "."})
		.pipe(browserify({
			exclude: "timezone-js",
			require: [
				["./index.js", {expose: packageName}]
			]
		}))
		.pipe(wrapUmd({
			namespace: "timezonecomplete",
			deps: [{
				name: "timezone-js",
				globalName: "timezoneJS",
				paramName: "timezoneJS",
				amdName: "timezone-js",
				cjsName: "timezone-js"
			}],
			exports: packageName,
			template: template
		}))
		.pipe(rename("timezonecomplete.js"))
		.pipe(gulp.dest("dist/"))
		.on("error", trapError); // make exit code non-zero
}


// Generic error handling function
// This is needed because Gulp always returns exit code 0
// unless an exception is thrown which gives a useless stack trace.
function trapError(e) {
	if (e.plugin && e.message) {
		// it is a gulp plugin error
		console.log("Error in plugin: " + e.plugin);
		console.log(e.message);
	}
	else {
		// some other error
		gutil.log(e);
	}
	console.log("\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\||||||||////////////////////");
	console.log(">>>>>>>>>>>>>>>>> FAILED <<<<<<<<<<<<<<<<<<<<");
	console.log("/////////////////||||||||\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\");
	exitCode++;
}