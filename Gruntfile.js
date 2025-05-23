module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        devDest: 'build/dev',
        prodDest: 'docs',
        tmpDest: 'build/tmp',
        concat: {
            js: {
                options: {
                    separator: ';\n\n'
                },
                src: ['src/js/**/*.js'],
                dest: '<%=tmpDest%>/<%= pkg.name %>.js'
            },
            less: {
                options: {
                    separator: '\n'
                },
                src: ['src/less/**/*.less'],
                dest: '<%=tmpDest%>/style.less'
            }
        },
        uglify: {
            options: {
                banner: '/* <%= pkg.desc %>. <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: '<%=tmpDest%>/<%= pkg.name %>.js',
                dest: '<%=prodDest%>/js/<%= pkg.name %>-<%= pkg.version %>.js'
            }
        },
        template: {
            dev: {
                options: {
                    data: {
                        scripts: '<script src="js/app.js"></script>' +
                            '<script src="js/utils.js"></script>' +
                            '<script src="js/panels.js"></script>' +
                            '<script src="js/dnd.js"></script>' +
                            '<script src="js/ajax.js"></script>' +
                            '<script src="js/keyboard.js"></script>' +
                            '<script src="js/handwriting.js"></script>' +
                            '<script src="js/recognition.js"></script>' +
                            '<script src="js/kakijun.js"></script>' +
                            '<script src="js/slider.js"></script>' +
                            '<script src="js/compressor.js"></script>' +
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
                    '<%=devDest%>/index.html': ['src/index.html']
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
                    '<%=prodDest%>/index.html': ['src/index.html']
                }
            }
        },
        less: {
            dev: {
                files: {
                    "<%=devDest%>/css/common.css": "src/less/common.less",
                    "<%=devDest%>/css/keyboard.css": "src/less/keyboard.less",
                    "<%=devDest%>/css/recognition.css": "src/less/recognition.less",
                    "<%=devDest%>/css/colorpicker.css": "src/less/colorpicker.less",
                    "<%=devDest%>/css/kakijun.css": "src/less/kakijun.less"
                }
            },
            prod: {
                options: {
                    compress: true
                },
                files: {
                    "<%=prodDest%>/css/<%= pkg.name %>-<%= pkg.version %>.css": "<%=tmpDest%>/style.less"
                }
            }
        },
        clean: {
            dev: ['<%=devDest%>'],
            prod: ['<%=tmpDest%>', '<%=prodDest%>']
        },
        copy: {
            dev: {
                files: [
                    {expand: true, cwd: 'src/', src: ['**/*.html'], dest: '<%=devDest%>/'},
                    {expand: true, cwd: 'src/assets/', src: ['**'], dest: '<%=devDest%>/'},
                    {expand: true, cwd: 'src/data/', src: ['**'], dest: '<%=devDest%>/data/'},
                    {expand: true, cwd: 'src/js/', src: ['**'], dest: '<%=devDest%>/js/'}
                ]
            },
            prod: {
                files: [
                    {expand: true, cwd: 'src/', src: ['**/*.html'], dest: '<%=prodDest%>/'},
                    {expand: true, cwd: 'src/data/', src: ['**'], dest: '<%=prodDest%>/data/'},
                    {expand: true, cwd: 'src/assets/', src: ['**'], dest: '<%=prodDest%>/'}
                ]
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-template');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.registerTask('default', ['clean:dev', 'less:dev', 'copy:dev', 'template:dev']);
    grunt.registerTask('prod', ['clean:prod', 'concat:js', 'uglify', 'concat:less', 'less:prod', 'copy:prod', 'template:prod']);
};