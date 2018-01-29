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
	const CONFIG = grunt.file.readJSON(`./build/config/${TARGET}_config.json`);
	
	
	// init config object
	grunt.initConfig({
		// get JSON config object
		// pkg: grunt.file.readJSON('package.json'),
		
		// task
		clean: {
			'build': {
				files: [
					{
						expand: true,
						cwd: 'build/src/', // build src folder
						src: [
							'*'
						]
					}
				]
			}
		},
		copy:{
			'build': {
				files: [
					{
						expand: true,
						cwd: 'src/',
						src: '**/*.gs.js',
						dest: 'build/src/',
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
						dest: 'build/src/',
						flatten: true,
						filter: 'isFile',
						rename: function (dest, src) {
							return dest + src.replace(/\.js$/, '.gs');
						}
					},
					{
						expand: true,
						cwd: 'src/',
						src: ['**/*.html', '**/*.json', '**/*.gs'],
						dest: 'build/src/',
						flatten: true,
						filter: 'isFile'
					}]
			}
		},
		config: {
			'clasp': {
				src: "build/src/.clasp.json",
				dest: "build/src/.clasp.json",
				configuration: CONFIG.clasp
			},
			'scriptManifest': {
				src: "build/src/appsscript.json",
				dest: "build/src/appsscript.json",
				configuration: CONFIG.script_manifest || {},
			},
		},
		clasp: {
			'newVersion': {
				runDir: 'build/src',
			},
			'push': {
				runDir: 'build/src',
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
	
	// custom task to change *.json
	grunt.registerMultiTask('config', 'Update properties in *.json file', function(){
		
		let self = this;
		if (!self || !self.data || !self.data.src || !self.data.dest) return;
		
		let configFile = self.files[0].src[0],
			configFileTarget = self.files[0].dest;
		
		let newConfig = self.data.configuration,
			config;
		try {
			// read config file
			config = grunt.file.readJSON(configFile)
		}
		catch (e) {
			config = {};
		}
		
		// update the provided parameters
		for (let i in newConfig){
			// noinspection JSUnfilteredForInLoop
			config[i] = newConfig[i];
		}
		
		// write updated config
		let configStr = JSON.stringify(config, null, 2);
		grunt.file.write(configFileTarget, configStr);
		
	});
	
	// Use clasp
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
		
		switch (this.target){
			case 'push':
				// Push
				console.log('Pushing files to the script');
				let pushRes = clasp('push');
				
				// Check result
				let resPush = /Pushed\s(\d+)\sfiles\./.exec(pushRes);
				if (!resPush) throw 'Error while pushing files to AppsScript';
				console.log(`Pushed files: ${resPush[1]}`);
				
				break;
			
			case 'newVersion':
				// create a new version
				console.log('Creating new script version');
				let versionRes = clasp('version');
				
				// Check result and get version num
				let resVers = /version\s(\d+)/.exec(versionRes);
				if (!resVers) throw 'Error while creating new version';
				
				let versionNum = +resVers[1];
				console.log('New version num: ' + versionNum);
				
				// Update version value:
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
		'config:clasp',
		'config:scriptManifest',
	]);
	
	grunt.registerTask('push', [
		'clasp:push',
	]);
	
	grunt.registerTask('publishAddon', [
		'clasp:push',
		'clasp:newVersion',
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