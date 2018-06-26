# README

## How do I get set up?

#### Summary of set up

* We assume that a code Editor (Webstorm, Visual Studio Code -> free), Git, and npm are installed on you computer.
* Clone the Git repository
* Run npm install in project root to install **_node_modules_** necessary to run grunt and build the project
* Create a _**/build/config/dev_config.json**_ file
It will contain the built target, and must be of the following form: (see below < config file format >)
```json
{
	"clasp": {"scriptId": "AppsScript file drive ID"},
	"script_manifest": {}
}
```
* We use the **@google/clasp** package to get/update apps script file in Google Drive.
Find the setup for clasp on this page: https://www.npmjs.com/package/@google/clasp


#### Build command

1. Renaming and copy files: Execute ``grunt build --target=$CONFiG_NAME$`` inside the main working directory ($CONFiG_NAME$ = dev, prod, whatever name you choose: it will use the config file named "/build/config/$CONFiG_NAME$_config.json")
2. Update the script: Execute ``grunt push --target=dev``
3. Both can be executed with: ``grunt build_push --target=dev``


#### Changing target (DEV, PROD for example)

You can define other target by using the "--target=targetName" grunt option.
For each target, a valid config file named: "/build/config/targetName_config.json" must exist.


#### Config file format:

/build/config/$CONFiG_NAME$_config.json
```json
{
	"clasp": {
		"scriptId": "$TARGET_SCRIPT_ID$"
	},
	"script_manifest": {}
}
```
NOTE: fill the "script_manifest" key with this format: https://developers.google.com/apps-script/concepts/manifests#manifest_structure


## Best practices ###

Git branches:

* master: merge Pull requests on master

* Set **tags** with increasing version on master's commit that are pushed in production (v1, v2, ...)

**Always merge with no fast forward !** (For major feature and update. Quick fix can be merged by default):
```
git merge --no-ff branchToMergeHere
```

## I want to publish as an Addon with my build process ##

It's possible, please check the repository branch:
[buildAddOn](https://github.com/JeanRemiDelteil/gas-starter-kit/tree/buildAddOn)

⚠
However be warned that using the command to publish as an addon will FORBID further manual publishing with the GAS interface.
⚠

## Who do I talk to? ###

* jeanremi.delteil@gmail.com