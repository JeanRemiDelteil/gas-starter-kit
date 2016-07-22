/**
 * Created by JeanRemiDelteil on 06/07/2016.
 */

var google = {
	script: {
		run: {
			// PLACE HERE your function called from Sidebar/Modale to keep the link
			
			
			// HANDLERs
			/**
			 * @param {function} onSuccess
			 * @return {google.script.run}
			 */
			withSuccessHandler: function (onSuccess) {},
			/**
			 * @param {function} onFailure
			 * @return {google.script.run}
			 */
			withFailureHandler: function (onFailure) {}
		}
	}
};

// Just for usage detection
google.script.run.withSuccessHandler(function () {});
google.script.run.withFailureHandler(function () {});

/** uncomment if project used for an addon */
// onInstall();