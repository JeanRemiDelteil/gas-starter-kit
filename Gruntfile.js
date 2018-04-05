module.exports = function(grunt) {
	/**
	 * @typedef {function} grunt.option
	 * @typedef {function} grunt.initConfig
	 */
	
	/** possible build :
	 *
	 * > build files to prepare pushing on App Script
	 * grunt build --target=dev
	 * grunt build --target=prod
	 *
	 * grunt publishAddon --target=prod
	 */
		
		// define target and config to run the task with
	const TARGET = grunt.option('target') || 'dev';
	
	/**
	 * Load config file directly
	 *
	 * @type {{
	 *   clasp: {
	 *     scriptId: string
	 *   },
	 *   script_manifest: {},
	 *   publishing: {
	 *     version: number,
	 *     versionOffset: number,
	 *     account: string,
	 *     appID: string,
	 *     manifest: Object
	 *   }
	 * }}
	 */
	let CONFIG;
	
	//<editor-fold desc="# Prepare CONFIG object">
	{
		try {
			CONFIG = require(`./build/config/${TARGET}_config.json`);
		}
		catch (e) {
			grunt.fail.fatal(`\x1b[31mERROR: "\x1b[0m\x1b[41m\x1b[30m${TARGET}\x1b[31m\x1b[0m\x1b[31m" is not a valid target build\x1b[0m`);
			
			// not needed, grunt.fail.fatal already exits
			return false;
		}
	}
	//</editor-fold>
	
	// init config object
	grunt.initConfig({
		
		// task
		clean: {
			'build': {
				files: [
					{
						expand: true,
						cwd: 'build/src/', // build source folder
						src: [
							'**/*' // Wipe everything
						]
					}
				]
			}
		},
		copy:{
			'build': {
				files: [{
					expand: true,
					cwd: 'src/',
					src: [
						'**/*.gs',
						'**/*.js',
						'**/*.html',
						'appsscript.json',
					],
					dest: 'build/src/',
					flatten: false, // set flatten to false once we use clasp folder name
					filter: 'isFile',
					'rename': (dest, src) => dest + src.replace(/\.gs\.js$/, '.js'),
				}]
			},
			'dependencies': {
				get files(){
					if (this._cachedFiles) return this._cachedFiles;
					
					// custom task to copy the package dependencies to build output
					let files = [];
					let {dependencies} = require('./package');
					
					// Allows access to saved packages information
					this.options.process = this.options.process.bind(this.options);
					
					// for every dependency package, build src and dest rules
					for (let pkgName in dependencies){
						// retrieve installed package version
						let {version} = require(`./node_modules/${pkgName}/package`);
						
						// save package info
						this.options._pkg[pkgName] = {
							name: pkgName,
							version: version,
						};
						
						files.push({
							expand: true,
							cwd: `node_modules/${pkgName}/src/`,
							src: [
								'**/*.gs',
								'**/*.js',
							],
							dest: `build/src/lib/${pkgName}/`,
							flatten: false, // set flatten to false once we use clasp folder name
							filter: 'isFile',
							'rename': (dest, src) => dest + src.replace(/\.gs\.js$/, '.js'),
						});
					}
					
					// Save files to only process them once (they should not change in between calls)
					this._cachedFiles = files;
					
					return files;
				},
				
				options: {
					_pkg: {},
					
					/**
					 * Add header with library information
					 *
					 * @param {string} content
					 * @param {string} srcPath
					 */
					process: function (content, srcPath) {
						// find pkg
						let [/*res*/, pkg] = /^node_modules\/(.+?)\/src\//.exec(srcPath) || [];
						if (!pkg) return content;
						
						let {name, version} = this._pkg[pkg];
						
						let header = `/**
 * package: ${name}
 * version: ${version}
 */`;
						
						return `${header}\n\n${content}`;
					}
				}
				
			}
		},
		jsonPatch: {
			'build': {
				srcFolder: 'build/src/',
				destFolder: 'build/src/',
				
				files: [
					{
						src: '.clasp.json',
						dest: '.clasp.json',
						data: CONFIG.clasp,
					},
					{
						src: 'appsscript.json',
						dest: 'appsscript.json',
						data: CONFIG.script_manifest || {},
					},
				],
			},
		},
		clasp: {
			'push': {
				runDir: 'build/src',
				command: 'push',
			},
			'version': {
				runDir: 'build/src',
				command: 'version',
			},
		},
		zip: {
			manifest: {}
		},
		webstore:{
			'updateItem': {
				/** Do publish or just update the draft */
				publish: true,
				
				/** @type {'trustedTesters' | 'default'} */
				target: 'trustedTesters'
			}
		}
	});
	
	
	// load tasks
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-copy');
	
	/**
	 * custom task to patch *.json or multiple *.json
	 */
	grunt.registerMultiTask('jsonPatch', 'Update properties in *.json file or multiple json files', function(){
		
		// Check if there are files to patch
		if (!this || !this.data || (!this.files && (!this.data.src || !this.data.dest))) return;
		
		let srcFolder = this.data['srcFolder'] || '';
		let destFolder = this.data['destFolder'] || '';
		
		/**
		 * Load a <src> JSON file, patch it with <data>, save it to <target>
		 *
		 * @param {string} src
		 * @param {string} target
		 * @param {Object} data
		 */
		function updateJsonFile(src, target, data) {
			
			let config = {};
			
			// read config file
			try { config = grunt.file.readJSON(srcFolder + src) }
			catch (e) {}
			
			// update the provided parameters
			for (let key in data) {
				let path = key.split('/'),
					configDrillDown = config;
				
				for (let i = 0; i < path.length - 1; i++) {
					// in case the path doesn't exist, create it. ONLY create object
					if (configDrillDown[path[i]] === undefined) {
						
						// Add array element at the end
						if (Array.isArray(configDrillDown) && path[i] === '-1') {
							path[i] = configDrillDown.push({}) - 1;
						}
						// Create Array of (-1) is used and object is empty (newly created)
						else if (Object.keys(configDrillDown).length === 0 && path[i] === '-1') {
							configDrillDown = [{}];
							path[i] = 0;
						}
						else {
							configDrillDown[path[i]] = {};
						}
					}
					
					configDrillDown = configDrillDown[path[i]];
				}
				
				let i = path.length - 1;
				if (configDrillDown[path[i]] === undefined) {
					
					// Add array element at the end
					if (Array.isArray(configDrillDown) && path[i] === '-1') {
						path[i] = configDrillDown.push({}) - 1;
					}
					// Create Array of (-1) is used and object is empty (newly created)
					else if (Object.keys(configDrillDown).length === 0 && path[i] === '-1') {
						configDrillDown = [{}];
						path[i] = 0;
					}
				}
				
				configDrillDown[path[i]] = data[key];
			}
			
			// write updated config
			grunt.file.write(destFolder + target, JSON.stringify(config, null, '\t'));
		}
		
		// Init files object
		let files = this.data.files || [{
			src: this.files[0].src[0],
			dest: this.files[0].dest,
			data: this.data.data
		}];
		
		// Patch every JSON files
		files.forEach(({src, dest, data}) => updateJsonFile(src, dest, data));
	});
	
	/**
	 * Use clasp
	 */
	grunt.registerMultiTask('clasp', 'push content in script, and create a version', function(){
		const child_process = require('child_process');
		
		/**
		 * @type {{
		 *   command: string,
		 *   runDir: string
		 * }}
		 */
		let param = this.data;
		
		function clasp(cmd){
			let res = child_process.execSync(`clasp ${cmd}`, {
				cwd: __dirname +'/'+ param.runDir
			});
			
			// Get string res
			return res.toString();
		}
		
		switch (param.command){
			case 'push':
				// Push
				console.log('Pushing files to the script');
				let pushRes = clasp('push');
				
				// Check result
				let resPush = /Pushed\s(\d+)\sfiles\./.exec(pushRes);
				if (!resPush) throw 'Error while pushing files to AppsScript';
				console.log(`Pushed files: ${resPush[1]}`);
				
				break;
			
			case 'version':
				// create a new version
				console.log('Creating new script version');
				let versionRes = clasp('version');
				
				// Check result and get version num
				let resVers = /version\s(\d+)/.exec(versionRes);
				if (!resVers) throw 'Error while creating new version';
				
				let versionNum = +resVers[1];
				console.log('New version num: ' + versionNum);
				
				// Update version value:
				!CONFIG.publishing && (CONFIG.publishing = {});
				CONFIG.publishing.version = versionNum;
				
				break;
		}
	});
	// Update addon ZIP file
	grunt.registerMultiTask('zip', 'Update addon zip file to prepare it for webstore deploy', function(){
		const JSZip = require('jszip');
		const fs = require('fs');
		let done = this.async();
		
		let manifest = CONFIG.publishing.manifest;
		
		if (!CONFIG.publishing.version){
			console.error(`The webstore draft can't be created with no script version`);
			
			return false;
		}
		
		// Update script version
		manifest['container_info'].container_version = `${CONFIG.publishing.version}`;
		// Bump manifest version (as script are always versioned, this should suffice)
		manifest.version = `${CONFIG.publishing.versionOffset + CONFIG.publishing.version}`;
		
		
		let zip = new JSZip();
		/**
		 * @typedef {function} zip.file
		 */
		
		new Promise((resolve, reject) => {
			fs.readFile('build/addon_webstore.zip', (err, data) => {
				if (err) reject(err);
				
				resolve(data);
			});
		})
			.then(data => zip.loadAsync(data))
			
			// Update manifest.json & create zip
			.then(() => {
				// Update manifest.json
				return zip.file('manifest.json', JSON.stringify(manifest))
					// create Zip file
					.generateAsync({type:"nodebuffer"})
			})
			
			// Write to disk
			.then(content => new Promise(resolve => {
				fs.writeFile("build/addon_webstore_draft.zip", content, resolve);
			}))
			
			// end task
			.then(err => {
				if (err) throw err;
				
				console.log('file create with success');
				
				done();
			})
			.catch(err => {
				console.error(err);
				
				done(false);
			})
		
	});
	// Use webStore API
	grunt.registerMultiTask('webstore', 'use Webstore API to send a draft and publish it', function(){
		
		// If we need to publish to unlisted, we need to update 
		/*
		 # In case of 'unlisted' target, only passing 'publishTarget' as a request header works
		 if [[ ${PUBLISH_TARGET} == 'unlisted' ]]; then
		 HTTP_CODE=$(curl \
		 -w %{http_code} \
		 -o api-response.json \
		 -H "Authorization: Bearer $ACCESS_TOKEN"  \
		 -H "x-goog-api-version: 2" \
		 -H "Content-Length: 0" \
		 -H "publishTarget: $PUBLISH_TARGET" \
		 -X POST \
		 -v https://www.googleapis.com/chromewebstore/v1.1/items/${EXTENSION_ID}/publish)
		 # For other targets ('default' or 'trustedTesters') we must pass 'target' as request body in json format
		 else
		 HTTP_CODE=$(curl \
		 -w %{http_code} \
		 -o api-response.json \
		 -H "Authorization: Bearer $ACCESS_TOKEN" \
		 -H "x-goog-api-version: 2" \
		 -H "Content-Type: application/json" \
		 -d "{\"target\":\"$PUBLISH_TARGET\"}" \
		 -X POST \
		 -v https://www.googleapis.com/chromewebstore/v1.1/items/${EXTENSION_ID}/publish)
		 fi
		 */
		
		
		const webstore = require('webstore-upload');
		
		const PUBLISH_DRAFT = this.data.publish || false;
		const PUBLICATION_TARGET = this.data.target || 'trustedTesters' ;
		
		
		if (!CONFIG.publishing.account){
			console.error('No publishing account, please update the configuration');
			return false;
		}
		
		
		// Load credentials
		const credentials = require('./build/cred/client_secret');
		const accountCred = credentials[CONFIG.publishing.account];
		
		if (!accountCred){
			console.error('Publishing account not found in the credential file');
			return false;
		}
		
		
		const uploadOptions = {
			accounts: {
				default: { //account under this section will be used by default 
					//publish: true, //publish item right after uploading. default false 
					client_id: accountCred['installed'].client_id,
					client_secret: accountCred['installed'].client_secret,
					refresh_token: accountCred.refresh_token
				},
				/*other_account: {
				 publish: true, //publish item right after uploading. default false 
				 client_id: 'ie204es2mninvnb.apps.googleusercontent.com',
				 client_secret: 'LEJDeBHfS',
				 refresh_token: '1/eeeeeeeeeeeeeeeeeeeeeee_aaaaaaaaaaaaaaaaaaa'
				 },
				 new_account: {
				 cli_auth: true, // Use server-less cli prompt go get access token. Default false 
				 publish: true, //publish item right after uploading. default false 
				 client_id: 'kie204es2mninvnb.apps.googleusercontent.com',
				 client_secret: 'EbDeHfShcj'
				 }*/
			},
			extensions: {
				addon: {
					//required
					appID: CONFIG.publishing.appID,
					//required, we can use dir name and upload most recent zip file 
					zip: 'build/addon_webstore_draft.zip',
					publishTarget: PUBLICATION_TARGET,
					publish: PUBLISH_DRAFT,
				},
				/*extension2: {
				 account: 'new_account',
				 //will rewrite values from 'account' section 
				 publish: true,
				 appID: 'jcbeonnlikcefedeaijjln',
				 zip: 'test/files/test2.zip',
				 publishTarget: 'trustedTesters'
				 }*/
			},
			uploadExtensions : ['addon']
		};
		
		let done = this.async();
		
		webstore(uploadOptions, 'default')['then'](() => {
			console.log('Published with success');
			
			done();
		})
			.catch(() => {
				console.error('Publishing failed');
				
				done(false);
			});
	});
	
	
	// NEVER name the task as the configurator object
	// the default task can be run just by typing "grunt" on the command line
	// USE THIS when multiple tasks must be chained
	grunt.registerTask('build', [
		'clean:build',
		'copy:build',
		'jsonPatch:build',
		'copy:dependencies',
	]);
	
	grunt.registerTask('push', [
		'clasp:push',
	]);
	
	grunt.registerTask('publishAddon', [
		'clasp:push',
		'clasp:version',
		'zip:manifest',
		'webstore:updateItem'
	]);
	
	grunt.registerTask('build_push', [
		'build',
		'push',
	]);
	grunt.registerTask('build_publish', [
		'build',
		'publishAddon',
	]);
	
	// define default task (for grunt alone)
	grunt.registerTask('default', ['build']);
	
	/**
	 * NOTES:
	 *
	 * - Beware of comments in JSON files, no comments can exists in JSON processed by config task
	 *
	 */
};