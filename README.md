# README #

### How do I get set up? ###

* Summary of set up

1. We assume that Webstorm, Git, and npm are installed on you computer.
2. Clone the Git repository
3. Run npm install in project root to install node_modules necessary to run grunt and build the project
4. Create a _devConfig.json_ file in the root folder.
They will contain the built target, and must be of the following form:
```
{
  "path": "src",
  "fileId": "DEV AppsScript file drive ID"
}
```
5. Install the node-google-apps-script npm package globally: (with sudo if on Mac/Linux)
```
npm install -g node-google-apps-script
```

* Deployment instructions DEV

1. Renaming and copy files: Execute ``grunt`` inside the main working directory
2. Upload files on drive: Go into 'built' directory (which contains the gapps.config.json file) and launch ``gapps upload``
3. If the /built doesn't contain the json file, you can run `gapps init xxx-your-script-id` to fetch the script and create the json file

* Deployment instructions PROD

1. Renaming and copy files: Execute ``grunt prod`` inside the main working directory
2. Upload files on drive: use the command ``gapps upload`` from the /built folder

* Test instructions

1. Publish -> Test as add-on (non-triggerable functionalities)
2. Publish -> Publish as add-on with permission to people with link (for triggable functionalities)

### Best practices ###

Git branches:

* When using console.log(): only this command on the same line. Issue would rise if not, because it's removed automatically at build time for PROD
* master: development branch

* PROD: what is currently in production (only merge commit here from master)

**Always merge with no fast forward !** (For major feature and update. Quick fix can be merged by default)
```
git merge --no-ff branchToMergeHere
```


### Who do I talk to? ###

* jean-remi.delteil@revevol.eu
* francois.marceau@revevol.eu
* romain.vialard@revevol.eu