// Workaround for autoprefixer

var path = require('path');

var publicPath = path.resolve('../../../../build/resources/main/public');
var rootPath = path.resolve('');

module.exports = function (grunt) {
    'use strict';

    var styleSrc = [
        'css/jquery-ui.css',
        'css/jquery-ui.structure.css',
        'css/jquery-ui.theme.css',

        'css/bootstrap.css',
        'css/bootstrap-switch.min.css',

        'css/progress-bar.css',
        'css/nprogress.css',

        'css/daterangepicker-bs3.css',
        'css/nvd3/nv.d3.min.css',
        'css/select2.css',
        'css/markitup.css',
        'css/magnific-popup.css',
        'css/spectrum.css',
        'css/highlightJS/atom-one-light.css',

        'compiled/scss/main.css',
        'css/animate.min.css',

        'css/markdown/simplemde.min.css',

        'css/dropzone/dropzone.min.css',
        'css/dropzone/basic.min.css',
        'css/c3.css'
    ];

    grunt.initConfig({
        sync: {
            main: {
                files: [{
                    cwd: rootPath,
                    src: [
                        'img/**',
                        'css/**/*.css',
                        'js/lib/**/*.js',
                        'compiled/**',
                        'epam/**'
                    ],
                    dest: publicPath
                }],
                verbose: false // Display log messages when copying files
            },
            production: {
                files: [{
                    cwd: rootPath,
                    src: [
                        'img/**',
                        'compiled/**',
                        'epam/**'
                    ],
                    dest: publicPath
                }],
                verbose: false
            }
        },
        copy: {
            mainDevelop: {
                files: [{
                    cwd: rootPath,
                    src: ['*', '!*.js', '!package.json', '!index.html'],
                    dest: publicPath + '/',
                    filter: 'isFile'
                }]

            },
            mainProduction: {
                files: [{
                    cwd: rootPath,
                    src: ['*', '!*.js', '!package.json'],
                    dest: publicPath + '/',
                    filter: 'isFile'
                }]
            },
            main: {
                src: 'templates/index.html',
                dest: publicPath + '/index.html'
            },
            images: {
                src: 'img/**',
                dest: 'compiled/'
            },
            fonts: {
                src: 'fonts/**',
                dest: 'compiled/'
            },
            jsLib: {
                files: [{
                    cwd: rootPath,
                    src: 'js/lib/**',
                    dest: publicPath + '/',
                    filter: 'isFile'
                }]
            },
            swagger: {
                files: [{
                    cwd: rootPath,
                    src: 'swagger-ui/**',
                    dest: publicPath + '/'
                }]
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1
            },
            target: {
                files: {
                    'compiled/css/styles.min.css': ['compiled/css/styles.css']
                }
            }
        },
        postcss: {
            options: {
                map: true,
                processors: [
                    require('autoprefixer')(
                        [
                            "Android 2.3",
                            "Android >= 4",
                            "Chrome >= 20",
                            "Firefox >= 24",
                            "Explorer >= 10",
                            "iOS >= 6",
                            "Opera >= 12",
                            "Safari >= 6"
                        ]
                    )
                ]
            },
            develop: {
                src: 'compiled/styles.css',
                dest: 'compiled/css/styles.css'
            },
            production: {
                src: 'compiled/styles.css',
                dest: 'compiled/css/styles.css'
            }
        },
        watch: {
            options: {
                spawn: false
            },
            copy: {
                files: [
                    'css/**/*.css',
                    'scss/**/*.scss',
                    'js/lib/**/*.js',
                    'build/**/*.*',
                    'compiled/**/*.*',
                    'dest/*.*',
                    'img/**/*.*'
                ],
                tasks: [
                    'sass:develop',
                    'concat:develop',
                    'postcss:develop',
                    'sync:main',
                    'watch'
                ]
            },
            copy_js: {
                files: ['js/src/**/*.js'],
                tasks: ['string-replace:jsDist']
            },
            index: {
                files: ['templates/index.html'],
                tasks: ['copy:main']
            },
            templates: {
                files: ['templates/**/*.html'],
                tasks: ['jst', 'sync:main']
            }
        },
        concat: {
            options: {
                sourceMap: false
            },
            production: {
                src: styleSrc,
                dest: 'compiled/css/styles.css'
            },
            develop: {
                options: {
                    sourceMap: true,
                    sourceMapStyle: 'inline'
                },
                src: styleSrc,
                dest: 'compiled/css/styles.css'
            }
        },
        jst: {
            compile: {
                options: {
                    //namespace: "anotherNameThanJST",      //Default: 'JST'
                    prettify: true,                        //Default: false|true
                    amdWrapper: false,                      //Default: false|true
                    amd: true,
                    templateSettings: {
                        variable: 'data'
                    },
                    processName: function (filename) {
                        //Shortens the file path for the template.
                        var array = filename.split('/');
                        var name = array[array.length - 1].replace('.html', "");
                        return name;
                    }
                },
                files: {
                    "compiled/templates/templates.js": [
                        "templates/**/*.html",
                        "!templates/index.html"
                    ]
                }
            }
        },
        sass: {
            production: {
                options: {
                    sourceMap: false,
                    style: 'compressed',
                    includePaths: require('node-bourbon').includePaths
                },
                files: [
                    { 'compiled/scss/main.css': 'scss/main.scss' },
                    { 'compiled/scss/swagger.css': 'scss/swagger.scss' }
                ]
            },
            develop: {
                options: {
                    sourceMap: true,
                    style: 'expanded',
                    includePaths: require('node-bourbon').includePaths
                },
                files: [
                    { 'compiled/scss/main.css': 'scss/main.scss' },
                    { 'compiled/scss/swagger.css': 'scss/swagger.scss' }
                ]
            }
        },
        requirejs: {
            compile: {
                options: {
                    //baseUrl: "path/to/base",
                    mainConfigFile: "jsReplace/src/config.js",
                    name: "config",
                    preserveLicenseComments: false,
                    //wrapShim: true,
                    out: "compiled/js/scripts.js",
                    optimize: "uglify",
                    paths: {
                        requireLib: '../lib/require-min-2.1.14'
                    },
                    include: 'requireLib'
                }
            }
        },
        clean: {
            compile: [rootPath + '/compiled'],
            publicClean: {
                options: {force: true},
                src: publicPath + '/*'
            }
        },
        useminPrepare: {
            html: 'index.html',
            options: {
                dest: publicPath,
                root: publicPath
            }
        },
        filerev: {
            options: {
                algorithm: 'md5',
                length: 8
            },
            files: {
                src: [
                    publicPath + '/compiled/js/*.js',
                    publicPath + '/compiled/css/*.css'
                ]
            }
        },
        usemin: {
            html: [publicPath + '/index.html'],
            options: {
                assetsDirs: [publicPath]
            }
        },
        'string-replace': {
            jsDist: {
                files: [{
                    expand: true,
                    cwd: '',
                    src: ['js/src/**/*.js'],
                    dest: publicPath + '/',
                    filter: 'isFile'
                }],
                options: {
                    replacements: [{
                        pattern: /'DEBUG_STATE'/g,
                        replacement: 'true'
                    }]
                }
            },
            jsProd: {
                files: [{
                    expand: true,
                    cwd: 'js/',
                    src: ['lib/**/*.js', 'src/**/*.js'],
                    dest: 'jsReplace/',
                    filter: 'isFile'
                }],
                options: {
                    replacements: [{
                        pattern: /'DEBUG_STATE'/g,
                        replacement: 'false'
                    }]
                }
            }
        },
    });

    require('time-grunt')(grunt);

    require('load-grunt-tasks')(grunt, {
        pattern: [
            'grunt-*',
            '!grunt-reportportal-*',
            '!grunt-legacy-util'
        ]
    });

    grunt.registerTask(
        'compileResource',
        [
            'jst',
            'copy:images',
            'copy:fonts'
        ]
    );

    grunt.registerTask(
        'develop',
        'Watches the project for changes, automatically copy files to the tomcat local server.',
        [
            'clean',
            'compileResource',
            'sass:develop',
            'concat:develop',
            'copy:main',
            'copy:mainDevelop',
            'copy:swagger',
            'postcss:develop',
            'string-replace:jsDist',
            'sync:main',
            'watch'
        ]
    );

    grunt.registerTask(
        'build',
        [
            'clean',
            'compileResource',
            'sass:production',
            'string-replace:jsProd',
            'requirejs',
            'string-replace:jsProd',
            'concat:production',
            'copy:mainProduction',
            'copy:jsLib',
            'copy:swagger',
            'postcss:production',
            'cssmin',
            'sync:production',
            'watch',
            'fileRevision'
        ]
    );

    grunt.registerTask(
        'fileRevision',
        [
            'useminPrepare',
            'filerev',
            'usemin'
        ]
    );

    grunt.registerTask('default', ['develop', 'watch']);
};
