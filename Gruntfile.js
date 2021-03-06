module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            js: {
                options: {
                    separator: ';\n\n'
                },
                src: ['src/js/**/*.js'],
                dest: 'tmp/<%= pkg.name %>.js'
            },
            less: {
                options: {
                    separator: '\n'
                },
                src: ['src/less/**/*.less'],
                dest: 'tmp/style.less'
            }
        },
        uglify: {
            options: {
                banner: '/* <%= pkg.desc %>. <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'tmp/<%= pkg.name %>.js',
                dest: 'build/release/js/<%= pkg.name %>-<%= pkg.version %>.js'
            }
        },
        template: {
            dev: {
                options: {
                    data: {
                        scripts: '<script src="js/app.js"></script>' +
                            '<script src="js/panels.js"></script>' +
                            '<script src="js/dnd.js"></script>' +
                            '<script src="js/ajax.js"></script>' +
                            '<script src="js/keyboard.js"></script>' +
                            '<script src="js/handwriting.js"></script>' +
                            '<script src="js/recognition.js"></script>' +
                            '<script src="js/slider.js"></script>' +
                            '<script src="js/colorpicker.js"></script>',
                        css: '<link type="text/css" rel="stylesheet" href="css/common.css">' +
                            '<link type="text/css" rel="stylesheet" href="css/keyboard.css">' +
                            '<link type="text/css" rel="stylesheet" href="css/recognition.css">' +
                            '<link type="text/css" rel="stylesheet" href="css/kakijun.css">' +
                            '<link type="text/css" rel="stylesheet" href="css/colorpicker.css">',
                        year: '<%= grunt.template.today("yyyy") %>',
                        pkgname: '<%= pkg.name %>',
                        version: "DEBUG"
                    }
                },
                files: {
                    'build/development/index.html': ['src/index.html'],
                    'build/development/keyboard.html': ['src/keyboard.html'],
                    'build/development/recognition.html': ['src/recognition.html'],
                    'build/development/kakijun.html': ['src/kakijun.html']
                }
            },
            prod: {
                options: {
                    data: {
                        scripts: '<script src="js/<%= pkg.name %>-<%= pkg.version %>.js"></script>',
                        css: '<link type="text/css" rel="stylesheet" href="css/<%= pkg.name %>-<%= pkg.version %>.css">',
                        year: '<%= grunt.template.today("yyyy") %>',
                        pkgname: '<%= pkg.name %>',
                        version: '<%= pkg.version %>'
                    }
                },
                files: {
                    'build/release/index.html': ['src/index.html'],
                    'build/release/keyboard.html': ['src/keyboard.html'],
                    'build/release/recognition.html': ['src/recognition.html'],
                    'build/release/kakijun.html': ['src/kakijun.html']
                }
            }
        },
        less: {
            dev: {
                files: {
                    "build/development/css/common.css": "src/less/common.less",
                    "build/development/css/keyboard.css": "src/less/keyboard.less",
                    "build/development/css/recognition.css": "src/less/recognition.less",
                    "build/development/css/colorpicker.css": "src/less/colorpicker.less",
                    "build/development/css/kakijun.css": "src/less/kakijun.less"
                }
            },
            prod: {
                options: {
                    yuicompress: true
                },
                files: {
                    "build/release/css/<%= pkg.name %>-<%= pkg.version %>.css": "tmp/style.less"
                }
            }
        },
        copy: {
            dev: {
                files: [
                    {expand: true, cwd: 'src/assets/', src: ['**'], dest: 'build/development/'},
                    {expand: true, cwd: 'src/data/', src: ['**'], dest: 'build/development/data/'},
                    {expand: true, cwd: 'src/js/', src: ['**'], dest: 'build/development/js/'},
                    {expand: true, cwd: 'src/lib/', src: ['**'], dest: 'build/development/lib/'}
                ]
            },
            prod: {
                files: [
                    {expand: true, cwd: 'src/data/', src: ['**'], dest: 'build/release/data/'},
                    {expand: true, cwd: 'src/assets/', src: ['**'], dest: 'build/release/'},
                    {expand: true, cwd: 'src/lib/', src: ['**'], dest: 'build/release/lib/'}
                ]
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-template');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask('default', ['template:dev', 'less:dev', 'copy:dev']);
    grunt.registerTask('prod', ['concat:js', 'uglify', 'concat:less', 'less:prod', 'template:prod', 'copy:prod']);
};