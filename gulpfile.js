const fileinclude = require('gulp-file-include');
const imagemin = require('gulp-imagemin');

let source_folder="src";
let project_folder=require("path").basename(__dirname);

let fs = require('fs');

let path={
    build:{
        html: project_folder+"/",
        css: project_folder+"/css/",
        js: project_folder+"/js/",
        img: project_folder+"/img/",
        fonts: project_folder+"/fonts/",
        other: source_folder+"/other/"
    },
    src:{
        html: [source_folder+"/*.html", "!" + source_folder + "/_*.html"],
        css: source_folder+"/scss/style.scss",
        js: source_folder+"/js/script.js",
        img: source_folder+"/img/**/*.{jpg,png,svg,gif,ico,webp}",
        fonts: source_folder+"/fonts/*.ttf",
        other: source_folder+"/other/*"
    },
    watch:{
        html: source_folder+"/**/*.html",
        css: source_folder+"/scss/**/*scss",
        js: source_folder+"/js/**/*js",
        img: source_folder+"/img/**/*.{jpg,png,svg,gif,ico,webp}",
        other: source_folder+"/other/*",
    },
    clean: "./" + project_folder+ "/"
}

let {src, dest, lastRun}= require('gulp'),
    gulp       = require('gulp'),
    browsersync= require("browser-sync").create(),
    Fileinclude= require("gulp-file-include"),
    del        = require("del"),
    scss       = require("gulp-sass"),
    autoprefixer= require("gulp-autoprefixer"),
    groupmedia  = require("gulp-group-css-media-queries"),
    rename      = require("gulp-rename"),
    cleancss    = require("gulp-clean-css"),
    clearjs     = require("gulp-uglify-es").default,
    Imagemin    = require("gulp-imagemin"),
    webp        = require("gulp-webp"),
    htmlwebp    = require("gulp-webp-html"),
    webpcss     = require("gulp-webpcss"),
    svgSprite   = require("gulp-svg-sprite"),
    ttf2woff    = require("gulp-ttf2woff"),
    ttf2woff2   = require("gulp-ttf2woff2"),
    fonter      = require("gulp-fonter"),
    sftp        = require('gulp-sftp');

gulp.task('sftp', function () {
    return gulp.src('Hostel_gulp/*')
        .pipe(sftp({
            host: '77.222.61.25',
            user: 'hostelkuya',
            pass: 'taatinepeg',
            timeout: 30000,
            port: 22,
            remotePath: '/home/h/hostelkuya/public_html'
        }));
});

function browserSync(params) {
    browsersync.init({
        server:{
            baseDir: "./" + project_folder+ "/"
        },
        port:3000,
        notify:true
    })
    params();
}
function html() {
    return src(path.src.html)
        .pipe(Fileinclude())
        .pipe(htmlwebp())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            })
        )
        .pipe(groupmedia())
        .pipe(autoprefixer({
            overrideBrowserslist: ["last 5 versions"],
            cascade: true,
        }))
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(
            rename({
                extname:"min.css"
            })
        )
        .pipe(cleancss())
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js() {
    return src(path.src.js)
        .pipe(Fileinclude())      
        .pipe(dest(path.build.js))
        .pipe(
            rename({
                extname:"min.js"
            })
        )
        .pipe(clearjs())
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function img() {
    return src(path.src.img)
        .pipe(webp({
            quality: 70
        }))
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(Imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            interlanced: true,
            optimizationLevel: 3

        }))     
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

function other() {
    return src(path.src.other)
        .pipe(dest(path.build.other))
        .pipe(browsersync.stream())
}

function fonts() {
    src(path.src.fonts)   
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

gulp.task('otf', function() {
    return gulp.src([source_folder + '/fonts/*.otf'])
    .pipe(fonter({
        formats: ['ttf']
    }))
    .pipe(dest(source_folder + '/fonts/'))
})

gulp.task('svg', function() {
    return gulp.src([source_folder + '/iconsprite/*.svg'])
    .pipe(svgSprite({
        mode: {
            stack: {
                sprite: "../icons/icons.svg",
                example: true
            }
        }
    }))
    .pipe(dest(path.build.img))
})

function fontsStyle() {
    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                    fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {}      

function watchFiles() {                 
    gulp.watch([path.watch.html], html);
    gulp.watch([path.watch.css], css);
    gulp.watch([path.watch.js], js);
    gulp.watch([path.watch.img], img);
}

function clean(){
    return del(path.clean);
}


let build= gulp.series(clean , gulp.parallel(js, css, html, fonts, img,other), fontsStyle);
let watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle=fontsStyle;
exports.fonts=fonts;
exports.img=img;
exports.fonts=fonts;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;


