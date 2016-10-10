const autoprefixer = require("gulp-autoprefixer");
const babel = require("gulp-babel");
const cssmin = require("gulp-cssmin");
const gulp = require("gulp");
const htmlmin = require("gulp-htmlmin");
const uglify = require("gulp-uglify");

gulp.task("copy", () => {
    return gulp
        .src(
            ["src/fonts/**", "src/img/**"],
            {
                base: "src"
            })
        .pipe(gulp.dest("lib"));
});

gulp.task("css", () => {
    return gulp.src("src/index.css")
        .pipe(autoprefixer({
            browsers: ["> 0%"]
        }))
        .pipe(cssmin())
        .pipe(gulp.dest("lib"));
});

gulp.task("html", () => {
    return gulp.src("src/index.html")
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest("lib"));
});

gulp.task("js", () => {
    return gulp.src("src/index.js")
        .pipe(babel({
            presets: ["es2015"]
        }))
        .pipe(uglify())
        .pipe(gulp.dest("lib"));
});

gulp.task("default", ["copy", "css", "html", "js"]);
