var _ = require('lodash');
var chalk_global = require('chalk');

function strmul(s, n) {
	var r = '';
	for (var i = 0; i < n; ++i) {
		r += s;
	}
	return r;
}

var KarmaChameleonReporter = function(baseReporterDecorator, formatError, helper, config) {
	baseReporterDecorator(this);

	// Configuration
	config.karmaReporter = config.karmaReporter || {};
	var specLength = config.karmaReporter.specLength || 75;

	this.failures = [];
	this.successes = [];
	this.skipped = [];

	// We use our own instance, respecting config.color
	var chalk = new chalk_global.constructor({enabled: config.colors});

	var specGroups = null;
	var currentPath;

	/* ========================================================================= *
	*
	* Overviews
	*
	* ========================================================================= */

	this.printOverallTestSummary = function(browsers, results) {
		this.printLineBreak();
		this.writeCommonMsg(chalk.bold(chalk.underline('TEST SUMMARY:')));
		this.printLineBreak();

		if (browsers.length >= 1 && !results.disconnected && !results.error) {
			this.writeCommonMsg(chalk.green(' ✓ ' + this.successes.length + ' TESTS SUCCEEDED '));
			this.writeCommonMsg(chalk.green('(' + this.successes.length / browsers.length + ' per Browser)'))
			this.printLineBreak();

			if (this.skipped) {
				this.writeCommonMsg(chalk.yellow(' - ' + this.skipped.length + ' TESTS SKIPPED '));
				this.writeCommonMsg(chalk.yellow('(' + this.skipped.length / browsers.length + ' per Browser)'))
				this.printLineBreak();
			}

			if (this.failures) {
				this.writeCommonMsg(chalk.red(' ✗ ' + this.failures.length + ' TESTS FAILED '));
				this.writeCommonMsg(chalk.red('(' + this.failures.length / browsers.length + ' per Browser)'))
				this.printLineBreak();
			}

			this.printLineBreak();
			this.writeCommonMsg(chalk.bold(chalk.underline('BROWSER SUMMARY:')));
			this.printLineBreak();
		}
	};

	this.printBrowsersOverview = function(browsers) {
		browsers.forEach(function(browser, i) {
			this.writeCommonMsg(' ' + i + ': ' + this.printBrowser(browser));
			this.printLineBreak();
		}, this);
	};

	this.printBrowser = function(browser) {
		var results = browser.lastResult;
		var totalExecuted = results.success + results.failed;

		var msg = browser + ': Executed ' + totalExecuted + ' of ' + results.total;

		if (results.failed || results.skipped) {
			msg += ' (';

			if (results.failed) {
				msg += chalk.red(results.failed + ' Failed');
			}

			if (results.failed && results.skipped) {
				msg += ', '
			}

		   if (results.skipped) {
				msg += chalk.yellow(results.skipped + ' Skipped');
			}

			msg += ') ';
		}

		if (browser.isReady) {
			msg += ' (' + helper.formatTimeInterval(results.totalTime) + ', ' + helper.formatTimeInterval(results.netTime) + ') ';
		}

	   return msg;
   };


	/* ========================================================================= *
	*
	* Helper Functions
	*
	* ========================================================================= */

	this.printLineBreak = function() {
		this.writeCommonMsg('\n');
	};

	this.parseFilePath = function(path) {
		return path
		.replace('/var/folders/1d/', '')
		.replace(/(?:_?).*?\//, '')
		.replace('T/', '')
		.replace(/\<.*/, '')
		.replace('"]', '')
		.replace(/\\n/g, '\n');
	};

	// Print the status for each individual browser
	this.printResultLabel = function(result) {
		if (result === undefined) {
			this.writeCommonMsg(chalk.yellow(' ? '));
		} else if (result.skipped || result.skipped_some) {
			this.writeCommonMsg(chalk.yellow(' - '));
		} else if (result.success) {
			this.writeCommonMsg(chalk.green(' ✓ '));
		} else {
			this.writeCommonMsg(chalk.red(' ✗ '));
		}
	};


	/* ========================================================================= *
	*
	* Individual tests
	*
	* ========================================================================= */

	this.printTestSuccess = function(specGroup, specTotals) {
		this.printSpecLabel([specGroup], 'green');
		this.writeCommonMsg(' ');
		this.writeCommonMsg(chalk.green(' ✓  '));
		this.writeCommonMsg(chalk.green(specTotals.successes));
		this.writeCommonMsg(chalk.green(' Passed '));
		this.writeCommonMsg('  ');
		this.printLineBreak();
	};

	this.printTestPartials = function(specGroup, specTotals) {
		// Use red if there are any errors. Otherwuse use yellow for skips.
		if (specTotals.errors > 0) {
			this.printSpecLabel([specGroup], 'red');
		} else {
			this.printSpecLabel([specGroup], 'yellow');
		}

		this.writeCommonMsg(' [ ');
		this.writeCommonMsg(chalk.green('✓ '));
		this.writeCommonMsg(chalk.green(specTotals.successes));
		this.writeCommonMsg(' | ');

		this.writeCommonMsg(chalk.yellow('- '));
		this.writeCommonMsg(chalk.yellow(specTotals.skips));
		this.writeCommonMsg(' | ');

		this.writeCommonMsg(chalk.red('✗ '));
		this.writeCommonMsg(chalk.red(specTotals.errors));
		this.writeCommonMsg(' ] ');

		this.printLineBreak();
	};

	// Print the name of the Spec.
	this.printSpecLabel = function(path, color) {
		var indent = "  ";
		path.forEach(function(s, i) {
			// We keep the current comon prefix and start to print
			// the new information on the first difference.
			if (i < currentPath.length && s != currentPath[i]) {
				currentPath.length = i;
			}
			if (i >= currentPath.length) {
				var label = indent + s;
				if (label.length > specLength) {
					label = label.slice(0, specLength-3) + '...';
				}

				if (color === 'green') {
					this.writeCommonMsg(chalk.green(label));
				} else if (color === 'yellow') {
					this.writeCommonMsg(chalk.yellow(label));
				} else if (color === 'red') {
					this.writeCommonMsg(chalk.red(label));
				} else {
					this.writeCommonMsg(label);
				}

				if (i < path.length-1) {
					this.printLineBreak();
				}
				else {
					this.writeCommonMsg(strmul(' ', specLength - label.length));
				}
				currentPath.push(s);
			}
			indent += "  ";
		}, this);
	};

	// Print the header displaying the data for each browser.
	this.printTableHeader = function(browsers) {
		this.writeCommonMsg(strmul(' ', specLength));
		this.writeCommonMsg(' ');
		browsers.forEach(function(browser, i) {
			this.writeCommonMsg(' ' +  i + ' ');
		}, this);
		this.printLineBreak();
	};

	this.calculateResults = function(specData, specTotals, browsers) {
		for (var spec in specData) {
			var specResults = specData[spec].results;

			var anySkips = false;
			var anyErrors = false;

			browsers.forEach(function(browser, i) {
				var browserResult = specResults[browser.id];

				if (browserResult.pending === true || browserResult.skipped === true) {
					anySkips = true;
				} else if (browserResult.success === false) {
					anyErrors = true;
				}
			});

			if (anySkips) {
				specTotals.skips++;
			} else if (anyErrors) {
				specTotals.errors++;
			} else {
				specTotals.successes++;
			}
		}
	};

	this.printTestDetails = function(specData, browsers) {
		// Check our Specs!
		for (var spec in specData) {
			var specResults = specData[spec].results;

			// Print our Suite.
			var firstResult = specResults[Object.keys(specResults)[0]]
			if (!firstResult.suite) {
				specResults[Object.keys(specResults)[0]].suite = [];
			}
			specResults[Object.keys(specResults)[0]].suite.push(firstResult.description);

			// See what our total stats are for this test.
			var anySkips = false;
			var anyErrors = false;

			browsers.forEach(function(browser, i) {
				var browserResult = specResults[browser.id];

				if (browserResult.pending === true || browserResult.skipped === true) {
					anySkips = true;
				} else if (browserResult.success === false) {
					anyErrors = true;
				}
			});

			// If there are no errors, don't display anything.
			if (anySkips === true || anyErrors === true) {
				this.printSpecLabel(specResults[Object.keys(specResults)[0]].suite);
				this.writeCommonMsg(' ');

				browsers.forEach(function(browser) {
					var browserResult = specResults[browser.id];

					if (browserResult.pending === true || browserResult.skipped === true) {
						this.writeCommonMsg(chalk.yellow(' - '));
						this.writeCommonMsg('  ');
					} else if (browserResult.success === false) {
						this.writeCommonMsg(chalk.red(' ✗ '));
						this.writeCommonMsg('  ');
					} else {
						this.writeCommonMsg(chalk.green(' ✓ '));
						this.writeCommonMsg('  ');
					}
				}, this);

				this.printLineBreak();
			}
		}
	};


	/* ========================================================================= *
	*
	* Error Printing
	*
	* ========================================================================= */

	this.printErrorDetails = function(errors) {
		this.printLineBreak();
		this.writeCommonMsg(chalk.bold(chalk.underline('FAILED TESTS:')));
		this.printLineBreak();
		this.printLineBreak();

		// Spit out each individual error.
		errors.forEach(function(failure, index) {
			var whitespace = '     ';
			index = index + 1;

			if (index > 1) {
				this.printLineBreak();
			}

			failure.log.forEach(function(log) {
				var testPath = failure.suite.join(' ');
				this.writeCommonMsg(chalk.red(`${index}): ${failure.description}`));
				this.printLineBreak();
				this.writeCommonMsg(chalk.red(`${whitespace}${testPath}`));
				this.printLineBreak();

				this.writeCommonMsg(`${whitespace}${formatError(log)}`);
				this.printLineBreak();
			}, this);
		}, this);

		this.printLineBreak();
	};


	/* ========================================================================= *
	*
	* Karma Events
	*
	* ========================================================================= */

	this.onRunStart = function() {
		this._browsers = [];
		currentPath = [];
		specGroups = null;
	};

	this.onRunComplete = function(browsers, results) {
		this.printOverallTestSummary(browsers, results);

		this.printBrowsersOverview(browsers);

		if (specGroups === null) {
			this.writeCommonMsg(chalk.red('No tests ran in any browsers.'));
			return;
		}

		this.printLineBreak();

		for (var specGroup in specGroups) {
			var specTotals = specGroups[specGroup].totals;
			var specData = specGroups[specGroup].specs;

			this.calculateResults(specData, specTotals, browsers);

			// If there are no errors, we print the success.
			if (specTotals.errors === 0 && specTotals.skips === 0) {
				this.printTestSuccess(specGroup, specTotals);
			} else {
				this.printLineBreak();
				this.printTableHeader(browsers);

				this.printTestPartials(specGroup, specTotals);

				this.printTestDetails(specData, browsers);
				this.printLineBreak();
			}
		};

		if (browsers.length >= 1) {
			if (results.failed) {
				this.printErrorDetails(this.failures);
			}
		}
	};

	this.specSuccess = this.specFailure = this.specSkipped = function(browser, result) {
		if (!result.suite) {
			return;
		}

		if (specGroups === null) {
			specGroups = [];
		}

		if (result.skipped || result.pending) {
			this.skipped.push(result);
		} else if (result.success) {
			// TODO: Maybe log tests that take a while, but we don't have many.
			// console.log(result.time);
			this.successes.push(result);
		} else {
			this.failures.push(result);
		}

		// The name of the overall Describe from the file
		var testFile = result.suite[0];

		// Set up the data structure for test display iteration.
		if (specGroups[testFile] === undefined) {
			specGroups[testFile] = {
				totals: {
					successes: 0,
					errors: 0,
					skips: 0
				},
				specs: []
			};
		}

		// The full string of the Spec.
		// var specString = result.suite.join('/') + '/' + result.description;
		var specId = result.id;

		if (specGroups[testFile].specs[specId] === undefined) {
			var newSpec = {
				specId: specId,
				spec: result.suite.slice().concat(result.description),
				results: {}
			}
			specGroups[testFile].specs[specId] = newSpec;
		}

		specGroups[testFile].specs[specId].results[browser.id] = result;
	};
};

KarmaChameleonReporter.$inject = [
	'baseReporterDecorator',
	'formatError',
	'helper',
	'config'
];

module.exports = {
	'reporter:karma-chameleon': ['type', KarmaChameleonReporter]
};
