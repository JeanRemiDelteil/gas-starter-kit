module.exports = function(grunt) {
	
	/** possible build :
	 *
	 * > build files to prepare pushing on DEV App Script
	 * grunt
	 *
	 * > build files to prepare pushing on PROD App Script
	 * grunt prod
	 *
	 * > build files to prepare manual copy on PROD App Script
	 * grunt prod-concat
	 *
	 */
	
	var prodConfig = {
		path: "src",
		fileId: "your PROD apps script file ID here"
	};
	var devConfig = grunt.file.readJSON('devConfig.json');
	
	// init config object
	grunt.initConfig({
		
		// get JSON config object
		pkg: grunt.file.readJSON('package.json'),
		
		// task
		clean: {
			'all': {
				files: [
					{
						expand: true,
						cwd: 'built/src/', // built src folder
						src: [
							'*'
						]
					}
				]
			}
		},
		concat: {
			'js': {
				src: 'src/*.js',
				dest: 'built/src/Code.js'
			}
		},
		copy:{
			'all': {
				files: [
					{
						expand: true,
						cwd: 'src/',
						src: '**/*.gs.js',
						dest: 'built/src/',
						flatten: true,
						filter: 'isFile',
						rename: function (dest, src) {
							return dest + src.replace(/\.gs\.js$/, '.gs');
						}
					},
					{
						expand: true,
						cwd: 'src/',
						src: '**/*.js',
						dest: 'built/src/',
						flatten: true,
						filter: 'isFile'
					},
					{
						expand: true,
						cwd: 'src/',
						src: '**/*.html',
						dest: 'built/src/',
						flatten: true,
						filter: 'isFile'
					}
				]
			},
			'html': {
				files: [
					{
						expand: true,
						cwd: 'src/',
						src: '**/*.html',
						dest: 'built/src/',
						flatten: true,
						filter: 'isFile'
					}]
			}
		},
		config: {
			'prod': {
				src: "built/gapps.config.json",
				dest: "built/gapps.config.json",
				configuration: prodConfig
			},
			'dev': {
				src: "built/gapps.config.json",
				dest: "built/gapps.config.json",
				configuration: devConfig
			}
			
		},
		removelogging: {
			'prod': {
				files: [{
					expand: true,
					cwd: 'built/src/',
					src: [
						'**/*.js',
						'**/*.html'
					],
					dest: 'built/src/'
				}]
			}
		}
	});
	
	
	// load tasks
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-remove-logging'); // https://www.npmjs.com/package/grunt-remove-logging
	
	// custom task to change *.json
	grunt.registerMultiTask('config', 'Update properties in *.json file', function(){
		
		var self = this;
		if (!self || !self.data || !self.data.src || !self.data.dest) return;
		
		var configFile = self.files[0].src[0],
			configFileTarget = self.files[0].dest;
		
		var newConfig = self.data.configuration;
		try {
			// read config file
			var config = grunt.file.readJSON(configFile)
		}
		catch (e) {
			config = {};
		}
		
		// update the provided parameters
		for (var i in newConfig){
			config[i] = newConfig[i];
		}
		
		// write updated config
		var configStr = JSON.stringify(config);
		grunt.file.write(configFileTarget, configStr);
		
	});
	
	
	
	// NEVER name the task as the configurator object
	// the default task can be run just by typing "grunt" on the command line
	// USE THIS when multiple tasks must be chained
	grunt.registerTask('dev', [
		'config:dev',
		'clean:all',
		'copy:all'
	]);
	grunt.registerTask('prod', [
		'config:prod',
		'clean:all',
		'copy:all',
		'removelogging:prod'
	]);
	grunt.registerTask('prod-concat', [
		'config:prod',
		'clean:all',
		'concat:js',
		'copy:html',
		'removelogging:prod'
	]);
	
	// define default task (for grunt alone)
	grunt.registerTask('default', ['dev']);
	
	/**
	 * NOTES:
	 *
	 * - Beware of comments in JSON files, no comments can exists in JSON processed by config task
	 *
	 */
};