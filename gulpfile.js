const gulp = require('gulp')
const rollup = require('gulp-rollup')
const gulpif = require('gulp-if')
const babel = require('rollup-plugin-babel')
const json = require('@rollup/plugin-json')
const browserSync = require('browser-sync').create()
const packageJson = require('./package.json')
const fs = require('fs')
const version = process.env.VERSION || packageJson.version

const banner = `/*!
* ${packageJson.name} v${version}
* Released under the ${packageJson.license} License.
*/`

const srcScriptFiles = ['src/**/*.js']

const continueOnError = process.argv.includes('--continue-on-error')
const skipMinification = process.argv.includes('--skip-minification')
const skipStandalone = process.argv.includes('--skip-standalone')

gulp.task('clean', () => {
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist')
  }

  return fs.promises.readdir('dist')
    .then(fileList => {
      if (fileList.length > 0) {
        const unlinkPromises = []
        fileList.forEach(fileName => {
          unlinkPromises.push(fs.promises.unlink(`dist/${fileName}`))
        })
        return Promise.all(unlinkPromises)
      }
    }).catch(error => {
      if (error.code !== 'ENOENT') {
        return Promise.reject(error)
      }
    })
})

gulp.task('build:scripts', () => {
  return gulp.src(['package.json', ...srcScriptFiles])
    .pipe(rollup({
      plugins: [
        json(),
        babel({
          exclude: 'node_modules/**'
        })
      ],
      input: 'src/js-announce.js',
      output: {
        format: 'umd',
        name: 'js-announce',
        banner: banner
      },
      onwarn (warning, rollupWarn) {
        if (warning.code !== 'CIRCULAR_DEPENDENCY') {
          rollupWarn(warning)
        }
      },
    }))
    .on('error', (error) => {
      if (continueOnError) {
        log(error)
      } else {
        throw error
      }
    })
    .pipe(gulp.dest('dist'))
    // .pipe(gulpif(!skipMinification, uglify()))
    // .pipe(gulpif(!skipMinification, rename('sweetalert2.min.js')))
    .pipe(gulpif(!skipMinification, gulp.dest('dist')))
})

gulp.task('build', gulp.series(
  'clean',
  gulp.parallel(
    'build:scripts', 
    // 'build:styles'
  ),
  ...(skipStandalone ? [] : ['build:standalone'])
))

gulp.task('develop', gulp.series(
  'build',
  async function watch () {
    // Does not rebuild standalone files, for speed in active development
    gulp.watch(srcScriptFiles, gulp.parallel('build:scripts'))
    // gulp.watch(srcStyleFiles, gulp.parallel('build:styles'))
  },
  async function sandbox () {
    browserSync.init({
      port: 8080,
      uiPort: 8081,
      notify: false,
      reloadOnRestart: true,
      https: false,
      server: ['./'],
      startPath: 'test/sandbox.html'
    })
    gulp.watch([
      'test/sandbox.html',
      'dist/js-announce.js',
      // 'dist/sweetalert2.css'
    ]).on('change', browserSync.reload)
  },
))