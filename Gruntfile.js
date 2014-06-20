module.exports = function(grunt) {
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
						scripts: 
							'<script src="js/app.js"></script>' +
                            '<script src="js/dnd.js"></script>' +
							'<script src="js/ajax.js"></script>' +
							'<script src="js/keyboard.js"></script>' +
                            '<script src="js/handwriting.js"></script>' +
							'<script src="js/recognition.js"></script>' +
							'<script src="js/slider.js"></script>',
                        css:
                            '<link type="text/css" rel="stylesheet" href="css/common.css">' +
                            '<link type="text/css" rel="stylesheet" href="css/keyboard.css">' +
                            '<link type="text/css" rel="stylesheet" href="css/recognition.css">',
                        year: '<%= grunt.template.today("yyyy") %>'
					}
				},
				files: {
					'build/development/index.html': ['src/index.html'],
                    'build/development/keyboard.html': ['src/keyboard.html'],
                    'build/development/recognition.html': ['src/recognition.html']
				}
			},
			pro: {
				options: {
					data: {
						scripts: '<script src="js/<%= pkg.name %>-<%= pkg.version %>.js"></script>',
                        css: '<link type="text/css" rel="stylesheet" href="css/style.css">',
                        year: '<%= grunt.template.today("yyyy") %>'
					}
				},
				files: {
					'build/release/index.html': ['src/index.html'],
                    'build/release/keyboard.html': ['src/keyboard.html'],
                    'build/release/recognition.html': ['src/recognition.html']
				}
			}
		},
		less: {
			dev: {
				files: {
					"build/development/css/common.css": "src/less/common.less",
                    "build/development/css/keyboard.css": "src/less/keyboard.less",
                    "build/development/css/recognition.css": "src/less/recognition.less"
				}
			},
			pro: {
				options: {
					yuicompress: true
				},
				files: {
					"build/release/css/style.css": "tmp/style.less"
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
			pro: {
				files: [
					{expand: true, cwd: 'src/data/', src: ['**'], dest: 'build/release/'},
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
	grunt.registerTask('pro', ['concat:js', 'uglify', 'concat:less', 'less:pro', 'template:pro', 'copy:pro']);
};