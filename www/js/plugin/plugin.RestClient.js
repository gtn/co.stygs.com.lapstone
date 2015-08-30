/**
/*
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>
 */

/**
 * @author Martin Kattner <martin.kattner@gmail.com>
 * 
 * Plugin:
 * 
 * @version 1.0
 * @namespace
 */
var plugin_RestClient = {
	config : null,
	constructor : function() {
		var dfd = $.Deferred();
		dfd.resolve();
		return dfd.promise();
	},
	pluginsLoaded : function() {
		app.debug.trace("plugin_RestClient.pluginsLoaded()");
		var dfd = $.Deferred(), promises = Array(), promiseOfPromises;
		// load the webservice definitions
		$.each(plugin_RestClient.config.wsdFiles, function(path, loadFile) {
			if (loadFile) {
				promises.push(plugin_RestClient.loadDefinitionFileAsync(path));
			}
		});

		promiseOfPromises = $.when.apply($, promises);

		promiseOfPromises.done(function() {
			dfd.resolve();
		});
		promiseOfPromises.fail(function() {
			dfd.reject();
		});

		return dfd.promise();
	},

	// called after all pages are loaded
	pagesLoaded : function() {
		app.debug.trace("plugin_RestClient.pagesLoaded()");
		app.debug.debug("plugin_" + this.config.name + ".pagesLoaded()", 11);
		var dfd = $.Deferred();
		dfd.resolve();
		return dfd.promise();
	},

	definePluginEvents : function() {
	},

	// called by pages.js
	afterHtmlInjectedBeforePageComputing : function(container) {
		app.debug.trace("plugin_RestClient.afterHtmlInjectedBeforePageComputing()");
	},
	pageSpecificEvents : function(container) {
		app.debug.trace("plugin_RestClient.pageSpecificEvents()");
	},

	loadDefinitionFileAsync : function(path) {
		app.debug.trace("plugin_RestClient.loadDefinitionFile()");
		var dfd = $.Deferred(), promise;
		promise = globalLoader.AsyncJsonLoader(path);

		promise.done(function(json) {
			$.each(json, function(name, values) {
				app.debug.debug("plugin_RestClient.loadDefinitionFile() - add: " + name);
				plugin_RestClient.config.webservices[name] = values;
			});
			dfd.resolve();
		});
		promise.done(function() {
			dfd.reject();
		});

		return dfd.promise();
	},

	loadDefinitionFile : function(path) {
		app.debug.trace("plugin_RestClient.loadDefinitionFile()");
		var json = globalLoader.JsonLoader(path);
		app.debug.debug("plugin_RestClient.loadDefinitionFile() - add each webservice definition");
		$.each(json, function(name, values) {
			app.debug.debug("plugin_RestClient.loadDefinitionFile() - add: " + name);
			plugin_RestClient.config.webservices[name] = values;
		});
	},

	getPath : function(parameter, path) {
		app.debug.trace("plugin_RestClient.getPath()");
		app.debug.debug("plugin_RestClient.getPath() - parameter: " + JSON.stringify(parameter));

		var data = path.split('?')[1];
		path = path.split('?')[0];

		if (parameter != undefined) {
			$.each(parameter, function(key, value) {
				if (typeof value == "object") {
					value = JSON.stringify(value);
					path = path.replace('{' + key + '}', encodeURIComponent(value));
				} else {
					path = path.replace('{' + key + '}', encodeURIComponent(value));
				}
				app.debug.debug("plugin_RestClient.getPath() - set in path: " + key + " = " + encodeURIComponent(value));

			});
		}

		if (data == undefined)
			data = ""

		app.debug.debug("plugin_RestClient.getPath() - path: " + path);
		app.debug.debug("plugin_RestClient.getPath() - data: " + data);
		app.debug.debug("plugin_RestClient.getPath() - parameter: " + JSON.stringify(parameter));

		return [ path, data ];
	},

	// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	// JSON functions
	// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

	getSingleJson : function(service, parameter, async) {
		app.debug.debug("plugin_RestClient.getSingleJson() - get a single json object; async = false");
		var server, path, json, splittedService, wsd;
		app.debug.debug("plugin_RestClient.getSingleJson() - get server name");
		if (service.indexOf('.') != -1) {
			splittedService = service.split(".");
			server = splittedService[0];
			service = splittedService[1];
		} else {
			server = app.wsc.getDefaultServerName();
		}

		// get the path which is defined in wsd file
		wsd = plugin_RestClient.config.webservices[service]
		if (wsd) {
			path = wsd.url;
		}

		else {
			app.debug.error("plugin_RestClient.getSingleJson() - service not defined: " + service);
		}

		// set async to false (in each case)
		async = false;

		// replace the parameters in path string
		path = plugin_RestClient.getPath(parameter, path);

		// ask for the json file
		json = app.wsc.getJson(path[0], path[1], parameter, plugin_RestClient.config.webservices[service].method, plugin_RestClient.config.webservices[service].timeout, async, plugin_RestClient.config.webservices[service].local, server);
		// add language wildcards wich could be defined in webservice
		// response
		if (plugins.functions.pluginLoaded("MultilanguageIso639_3")) {
			if (json.language != undefined) {
				$.each(json.language, function(key, value) {
					app.lang.addParameter(key, value);
				});
			}
		}
		return json;
	},
	getSingleJsonAsync : function(service, parameter, async) {
		app.debug.debug("plugin_RestClient.getSingleJsonAsync() - get a single json object; async = true;");
		// the deferred object for the caller
		var dfd = $.Deferred(), server, path, promise, splittedService, wsd;

		app.debug.debug("plugin_RestClient.getSingleJsonAsync() - get server name");
		if (service.indexOf('.') != -1) {
			splittedService = service.split(".");
			server = splittedService[0];
			service = splittedService[1];
		} else {
			server = app.wsc.getDefaultServerName();
		}

		app.debug.debug("plugin_RestClient.getSingleJsonAsync() server: " + server + "; service: " + service);

		// get the path which is defined in wsd file
		wsd = plugin_RestClient.config.webservices[service]
		if (wsd) {
			path = wsd.url;
		}

		else {
			app.debug.error("plugin_RestClient.getSingleJsonAsync() - service not defined: " + service);
		}

		// replace the parameters in path string
		path = plugin_RestClient.getPath(parameter, path);

		// ask for the json file
		promise = app.wsc.getJson(path[0], path[1], parameter, plugin_RestClient.config.webservices[service].method, plugin_RestClient.config.webservices[service].timeout, async, plugin_RestClient.config.webservices[service].local, server);
		// add language wildcards wich could be defined in webservice
		// response

		promise.done(function(json) {
			// alert("async webservice call done");
			if (plugins.functions.pluginLoaded("MultilanguageIso639_3")) {
				if (json.language != undefined) {
					$.each(json.language, function(key, value) {
						app.lang.addParameter(key, value);
					});
				}
			}
			app.debug.debug("plugin_RestClient.getSingleJsonAsync()- Webservice call done: " + JSON.stringify(json));
			dfd.resolve(json);
		});

		promise.fail(function(error) {
			app.debug.debug("plugin_RestClient.getSingleJsonAsync() - Webservice call failed: " + JSON.stringify(error));
			dfd.reject(error);
		});

		return dfd.promise();
	},

	getMultipleJson : function(service, parameter, async) {
		app.debug.debug("plugin_RestClient.getMultipleJson() - get multible json objects; async = false");
		var jsonObject = {};
		app.debug.debug("plugin_RestClient.getMultipleJson() - generate ajax call for each webservice");
		$.each(service, function(key, call) {
			var serviceName = call[0], parameter = call[1], server, path, json, splittedService, wsd;

			app.debug.debug("plugin_RestClient.getMultipleJson() - get server name");
			if (serviceName.indexOf('.') != -1) {
				splittedService = serviceName.split(".");
				server = splittedService[0];
				serviceName = splittedService[1];
			} else {
				server = app.wsc.getDefaultServerName();
			}
			// set async to false (in each case)
			async = false;

			app.debug.debug("plugin_RestClient.getMultipleJson() - get webservice path from wsd file");
			wsd = plugin_RestClient.config.webservices[serviceName]
			if (wsd) {
				path = wsd.url;
			}

			else {
				app.debug.error("plugin_RestClient.getMultipleJson() - service not defined: " + serviceName);
			}

			app.debug.debug("plugin_RestClient.getMultipleJson() - replace parameters in path");
			path = plugin_RestClient.getPath(parameter, path);

			app.debug.debug("plugin_RestClient.getMultipleJson() -  ask for the json file");
			json = app.wsc.getJson(path[0], path[1], parameter, plugin_RestClient.config.webservices[serviceName].method, plugin_RestClient.config.webservices[serviceName].timeout, async, plugin_RestClient.config.webservices[serviceName].local,
					server);

			app.debug.debug("plugin_RestClient.getMultipleJson() - add language wildcards wich could be defined in webservice response");
			if (plugins.functions.pluginLoaded("MultilanguageIso639_3")) {
				if (json.language != undefined) {
					$.each(json.language, function(key, value) {
						app.lang.addParameter(key, value);
					});
				}
			}
			app.debug.debug("plugin_RestClient.getMultipleJson() - add result to resultObject");
			jsonObject[serviceName] = json;
		});
		return jsonObject;
	},

	getMultipleJsonAsync : function(service, parameter, async) {
		app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - get multible json objects; async = true");
		// the deferred object for the caller
		async = true;
		var dfd = $.Deferred(), promiseArray = [], webserviceNamesArray = [], splittedService;
		app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - generate a ajax call for each webservice");
		$.each(service, function(key, call) {
			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - generate single async ajax call");
			var serviceName = call[0], parameter = call[1], server, path, promise, wsd;

			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - get server name");
			if (serviceName.indexOf('.') != -1) {
				splittedService = serviceName.split(".");
				server = splittedService[0];
				serviceName = splittedService[1];
			} else {
				server = app.wsc.getDefaultServerName();
			}

			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - get webservice path from wsd file");

			wsd = plugin_RestClient.config.webservices[serviceName]
			if (wsd) {
				path = wsd.url;
			}

			else {
				app.debug.error("plugin_RestClient.getMultipleJsonAsync() - service not defined: " + serviceName);
			}

			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - replace parameters in path");
			path = plugin_RestClient.getPath(parameter, path);

			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - ask for the deferred promise object");

			promise = app.wsc.getJson(path[0], path[1], parameter, plugin_RestClient.config.webservices[serviceName].method, plugin_RestClient.config.webservices[serviceName].timeout, async, plugin_RestClient.config.webservices[serviceName].local,
					server);

			promiseArray.push(promise);

			webserviceNamesArray.push(serviceName);
		});
		// alert("promiseArray: " + JSON.stringify(promiseArray));
		// http://stackoverflow.com/questions/4878887/how-do-you-work-with-an-array-of-jquery-deferreds
		// http://stackoverflow.com/questions/5627284/pass-in-an-array-of-deferreds-to-when
		$.when.apply($, promiseArray).then(function() {
			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - all async webservices are done");
			// alert(JSON.stringify([].slice.apply(arguments)));
			var argumentsArray = [].slice.apply(arguments), resultObject = {};
			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - add each result to resultObject");
			$.each(webserviceNamesArray, function(key, value) {

				if (plugins.functions.pluginLoaded("MultilanguageIso639_3")) {
					if (argumentsArray[key].language != undefined) {
						$.each(argumentsArray[key].language, function(key, value) {
							app.lang.addParameter(key, value);
						});
					}
				}

				resultObject[value] = argumentsArray[key];
			});
			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - async webservice call done: " + JSON.stringify(resultObject));
			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - resolve deferred object");
			dfd.resolve(resultObject);
		}, function(error) {
			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - error on ohne or more async webservices");
			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - async webservice call failed: " + JSON.stringify(error));
			app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - reject deferred object");
			dfd.reject(error);
		});
		app.debug.debug("plugin_RestClient.getMultipleJsonAsync() - return: deferred promise");
		return dfd.promise();
	},

	functions : {
		getWsd : function(serviceName) {
			app.debug.trace("plugin_RestClient.functions.getWsd()");
			return plugin_RestClient.config.webservices[serviceName];
		},

		addWebserviceDefinition : function(name, path, method, timeout, cachetime, local) {
			app.debug.debug("plugin.RestClient.js plugin_RestClient.functions.addWebserviceDefinition(" + name + ", " + path + ", " + method + ", " + timeout + ", " + cachetime + ", " + local + ")");
			plugin_RestClient.config.webservices[name] = {
				"url" : path,
				"method" : method,
				"timeout" : timeout,
				"cachetime" : cachetime,
				"local" : local
			};
			return true;
		},
		addWebserviceDefinitionFile : function(path) {
			app.debug.debug("plugin_RestClient.functions.addWebserviceDefinitionFile(" + path + ")");
			plugin_RestClient.loadDefinitionFile(path);
		},
		getJson : function(service, parameter, async, attempts, dfd) {
			app.debug.debug("plugin_RestClient.functions.getJson(" + service + ", " + parameter + ", " + async + ")");
			var json, i, promise;
			if (plugins.config.KeepAlive === true && app.alive.isAlive() === true) {
				if (typeof service == "object" && (parameter == false || parameter == undefined)) {
					app.debug.debug("plugin_RestClient.functions.getJson() - case: get multible json objects; async = false");
					for (i = 0; i < attempts; i++) {
						app.debug.debug("plugin_RestClient.functions.getJson() - AJAX attempt " + i + " of " + attempts);
						json = plugin_RestClient.getMultipleJson(service, parameter, async);
						if (json != null)
							return json;
					}
				}

				else if (typeof service == "object" && parameter == true) {
					app.debug.debug("plugin_RestClient.functions.getJson() - case: get multible json objects; async = true");
					promise = plugin_RestClient.getMultipleJsonAsync(service, parameter, async);

					if (dfd == null || dfd == undefined)
						dfd = $.Deferred();

					promise.done(function(json) {
						dfd.resolve(json);
					});

					promise.fail(function(errorObject) {
						app.debug.debug("plugin_RestClient.functions.getJson() - multible json object; case: webservice failed: " + JSON.stringify(errorObject));
						if (async > 1) {
							async--;
							plugin_RestClient.functions.getJson(service, parameter, async, null, dfd);
						} else {
							app.debug.debug("plugin_RestClient.functions.getJson() - multiple json object; reject deferred object");
							dfd.reject(errorObject);
						}
					});

					return dfd.promise();

				}

				else if (typeof service == "string" && (parameter == undefined || typeof parameter == "object") && (async == undefined || async == false)) {
					app.debug.debug("plugin_RestClient.functions.getJson() - case: get a single json object; async = false");
					for (i = 0; i < attempts; i++) {
						app.debug.debug("plugin_RestClient.functions.getJson() - AJAX attempt " + i + " of " + attempts);
						json = plugin_RestClient.getSingleJson(service, parameter, async);
						if (json != null)
							return json;
					}
				}

				else if (typeof service == "string" && (parameter == undefined || typeof parameter == "object") && async == true) {
					app.debug.debug("plugin_RestClient.functions.getJson() - case: get a single json object; async = true");
					promise = plugin_RestClient.getSingleJsonAsync(service, parameter, async);

					if (dfd == null || dfd == undefined)
						dfd = $.Deferred();

					promise.done(function(json) {
						dfd.resolve(json);
					});

					promise.fail(function(errorObject) {
						app.debug.debug("plugin_RestClient.functions.getJson() - single json object; case: webservice failed: " + JSON.stringify(errorObject));
						if (attempts > 1) {
							attempts--;
							plugin_RestClient.functions.getJson(service, parameter, async, attempts, dfd);
						} else {
							app.debug.debug("plugin_RestClient.functions.getJson() - single json object; reject deferred object");
							dfd.reject(errorObject);
						}
					});

					return dfd.promise();
				}
			} else {
				app.alive.badConnectionHandler();
			}
			return null;
		}
	}
};
