/**
 * Created by JeanRemiDelteil on 06/07/2016.
 */

var google = {
	script: {
		run: function () {}
	}
};

// NEVER DO THAT in normal code
// this overwrite the prototype, here we do this of auto-completion only
google.script.run.prototype = {
	// PLACE HERE your function called from Sidebar/Modale to keep the link
	
};



/**
 * @param {function} successHandler
 * @return {google.script.run}
 */
google.script.run.withSuccessHandler = function (successHandler) {};
/**
 * @param {function} failureHandler
 * @return {google.script.run}
 */
google.script.run.withFailureHandler = function (failureHandler) {};

google.script.run.prototype.withSuccessHandler = google.script.run.withSuccessHandler;
google.script.run.prototype.withFailureHandler = google.script.run.withFailureHandler;

/** uncomment if project used for an addon */
// onInstall();