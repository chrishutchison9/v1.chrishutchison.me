import gulp from "gulp";
import sass from "gulp-sass";
import {spawn} from "child_process";
import hugoBin from "hugo-bin";
import gutil from "gulp-util";
import postcss from "gulp-postcss";
import cssImport from "postcss-import";
import cssnext from "postcss-cssnext";
import BrowserSync from "browser-sync";
import webpack from "webpack";
import webpackConfig from "./webpack.conf";
import svgstore from "gulp-svgstore";
import svgmin from "gulp-svgmin";
import inject from "gulp-inject";
import replace from "gulp-replace";
import cssnano from "cssnano";

const browserSync = BrowserSync.create();
// const hugoBin = `./bin/hugo.${process.platform === "win32" ? "exe" : process.platform}`;
const defaultArgs = ["-d", "../dist", "-s", "site"];

// Hugo arguments
const hugoArgsDefault = ["-d", "../dist", "-s", "site", "-v"];
const hugoArgsPreview = ["--buildDrafts", "--buildFuture"];

// Development tasks
gulp.task("hugo", (cb) => buildSite(cb));

gulp.task("hugo-preview", (cb) => buildSite(cb, hugoArgsPreview));

// Build/production tasks
gulp.task("build", ["sass", "js", "cms-assets", "hugo"], (cb) => buildSite(cb, defaultArgs, "production"));
gulp.task("build-preview", ["sass", "js"], (cb) => buildSite(cb, hugoArgsPreview, "production"));


// Compile CSS with PostCSS
// gulp.task("css", () => (
//   gulp.src("./src/css/*.css")
//     .pipe(postcss([
//       cssImport({from: "./src/css/main.css"}),
//       cssnext(),
//       cssnano(),
//     ]))
//     .pipe(gulp.dest("./dist/css"))
//     .pipe(browserSync.stream())
// )
// );

gulp.task("cms-assets", () => (
  gulp.src("./node_modules/netlify-cms/dist/*.{woff,eot,woff2,ttf,svg,png}")
    .pipe(gulp.dest("./dist/css"))
))

gulp.task("js", (cb) => {
  const myConfig = Object.assign({}, webpackConfig);

  webpack(myConfig, (err, stats) => {
    if (err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
      colors: true,
      progress: true
    }));
    browserSync.reload();
    cb();
  });
});


gulp.task('sass', function () {
  return gulp.src('./site/dev/scss/*.scss')
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest("./dist/css"))
    .pipe(browserSync.stream());
});


gulp.task("svg", () => {
  const svgs = gulp
    .src("site/static/img/icons/*.svg")
    .pipe(svgmin())
    .pipe(svgstore({inlineSvg: true}));

  function fileContents(filePath, file) {
    return file.contents.toString();
  }

  return gulp
    .src("site/layouts/partials/svg.html")
    .pipe(inject(svgs, {transform: fileContents}))
    .pipe(gulp.dest("site/layouts/partials/"));
});

gulp.task("server", ["hugo", "cms-assets", "js", 'sass', "svg"], () => {
  browserSync.init({
    server: {
      baseDir: "./dist"
    }
  });
  gulp.watch("./src/js/**/*.js", ["js"]);
  gulp.watch("./site/static/img/icons/*.svg", ["svg"]);
  gulp.watch("./site/**/*", ["hugo"]);
  gulp.watch("./site/dev/scss/**/*.scss", ["sass"]);

});

/**
 * Run hugo and build the site
 */
function buildSite(cb, options, environment = "development") {
  const args = options ? hugoArgsDefault.concat(options) : hugoArgsDefault;

  process.env.NODE_ENV = environment;

  return spawn(hugoBin, args, {stdio: "inherit"}).on("close", (code) => {
    if (code === 0) {
      browserSync.reload("notify:false");
      cb();
    } else {
      browserSync.notify("Hugo build failed :(");
      cb("Hugo build failed");
    }
  });
}
