# README

## How do I get set up?

#### Summary of set up

1. We assume that a code Editor (Webstorm, Visual Studio Code -> free), Git, and npm are installed on you computer.
2. Clone the Git repository
3. Run npm install in project root to install **_node_modules_** necessary to run grunt and build the project
4. Create a _**/build/config/dev_config.json**_ file
It will contain the built target, and must be of the following form: (see below < config file format >)
```
{
	"clasp": {"scriptId": "AppsScript file drive ID"},
	"publishing": {}
}
```
5. We use the **@google/clasp** package to get/update apps script file in Google Drive.
Find the setup for clasp on this page: https://www.npmjs.com/package/@google/clasp


#### Build command

1. Renaming and copy files: Execute ``grunt build --target=$CONFiG_NAME$`` inside the main working directory ($CONFiG_NAME$ = dev, prod, whatever name you choose: it will use the config file named "/build/config/$CONFiG_NAME$_config.json")
2. Update the script: Execute ``grunt push --target=dev``
3. Both can be executed with: ``grunt build_push --target=dev``
4. To publish an addon (JUST FOR TEST): ``grunt build_publish --target=testAddon``

#### Changing target (DEV, PROD, testAddon for example)

You can define other target by using the "--target=targetName" grunt option.
For each target, a valid config file named: "/build/config/targetName_config.json" must exist.

#### Config file format:

When not publishing as an Addon:

/build/config/$CONFiG_NAME$_config.json
```json
{
	"clasp": {
		"scriptId": "$TARGET_SCRIPT_ID$"
	},
	"script_manifest": {},
	"publishing": {}
}
```

When publishing as an Addon with the command:

/build/config/$CONFiG_NAME$_config.json
```json
{
	"clasp": {
		"scriptId": "$TARGET_SCRIPT_ID$"
	},
	"script_manifest": {},
	"publishing": {
		"version": null,
		"versionOffset": 0,
		"account": "$ACCOUNT_NAME_FOR_WEBSTORE_CREDENTIAL$",
		"appID": "$WEBSTORE_ITEM_ID$",
		
		"manifest": {
			"update_url" : "https://clients2.google.com/service/update2/crx",
			"container" : ["GOOGLE_SPREADSHEET"],
			"app" : {
				"background" : {
					"scripts" : ["background.js"]
				}
			},
			"api_console_project_id" : "$SCRIPT_PROJECT_ID$",
			"container_info" : {
				"post_install_tip" : "$POST_INSTAL_TEXT$",
				"container_id" : "$OLD_SCRIPT_ID$",
				"container_version" : "0"
			},
			"manifest_version" : 2,
			"name" : "$ADDON_NAME$",
			"icons" : {
				"16" : "script-icon_16.png",
				"128" : "script-icon_128.png"
			},
			"version" : "0"
		}
	}
}
```
NOTE: The "manifest" key can be copied from the chrome webstore item, all field will already be correctly filled.

NOTE: The first publishing must be done manually.

NOTE: fill the "script_manifest" key with this format: https://developers.google.com/apps-script/concepts/manifests#manifest_structure

#### Credential file format:

Those credentials can be obtained by creating a Google project on the addon used to publish the Addon.
Then following the instructions here: https://developer.chrome.com/webstore/using_webstore_api#beforeyoubegin
Download the json file for the created ClientID and use it to fill the credential file below.

More information on the webstore API used: https://www.npmjs.com/package/webstore-upload

/build/config/$CONFiG_NAME$_config.json
```json
{
	"$ACCOUNT_NAME_FOR_WEBSTORE_CREDENTIAL$": {
		"refresh_token": "$REFRESH_TOKEN$",
		"installed": {
			"client_id": "$CLIENT_ID$",
			"client_secret": "$CLIENT_SECRET$"
		}
	},
	"$ANOTHER_ACCOUNT_NAME_FOR_WEBSTORE_CREDENTIAL$": "{...}"
}
```
NOTE: The first code obtain when executing the procedure to obtain the refresh_token is NOT the refresh_token, it's a authorizatin code (starting by "4/")

The refresh_token usualy starts by "1/" and is obtained by exchanging the auth code. All the procedure on this page must be followed until the end: https://developer.chrome.com/webstore/using_webstore_api#beforeyoubegin

#### Test instructions

1. Publish -> Test as add-on (non-triggerable functionalities)
2. Publish -> Publish as add-on with permission to people with link (for triggable functionalities)

## Best practices ###

Git branches:

* master: merge Pull resquests on master

* Set **tags** with increasing version on master's commit that are pushed in production (v1, v2, ...)

**Always merge with no fast forward !** (For major feature and update. Quick fix can be merged by default):
```
git merge --no-ff branchToMergeHere
```

## WARNING ###

Using the command to publish as an addon will **FORBID** further manual publishing with the GAS interface.

## Who do I talk to? ###

* jeanremi.delteil@gmail.com