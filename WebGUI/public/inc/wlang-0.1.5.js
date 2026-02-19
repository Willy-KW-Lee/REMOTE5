/*
 * Remote5 wLanguages - 2023.11.03~
 * Author : Willy.Lee (wiljwilj@hotmail.com)
 */
// 0.1.1 - 2023.11.03
// 0.1.3 - 2025.05.05 loading default lang-json
// 0.1.4 - 2026.02.13 syntex error fixed
// 0.1.5 - 2026.02.19 add function finding by contrycode

(function(){
	"use strict";
	
	var version = "0.1.3";
	
	function wl( defaultLang, cb ) {
		var i = this;
		if (typeof defaultLang == "string") {
			var oLang = new XMLHttpRequest();
			oLang.open("GET", defaultLang, true);
			oLang.send();
			oLang.onreadystatechange = e=>{
				if (oLang.readyState == 4 && oLang.status == 200){
					try{
						var json = JSON.parse(oLang.responseText);
						//console.dir(json);
						i.defaultLang = json;
						if (cb) cb();
					}
					catch {
						console.error(defaultLang + " parsing error");
						if (cb) cb();
					}
				}
				else {
					if (cb) cb();
				}
			}
		}
		else {
			i.defaultLang = defaultLang;
			if (cb) cb();
		}
	}
	wl.prototype = {
		From:function(key, section){
			var lang = this.localLang;
			if (lang != null && section != null)
				lang = lang[section];
			if (lang != null && lang[key] != null)
				return lang[key];
			if (this.defaultLang == null)
				return key;
			lang = this.defaultLang;
			if (lang != null && section != null)
				lang = lang[section];
			if (lang != null) {
				if (lang[key] != null)
					return lang[key];
				if (lang[key] !== undefined)
					return key;
			}
			return null;
		},

		load:function(url, cb){
			this.localLang = null;

			var oLang = new XMLHttpRequest();
			oLang.open("GET", url, true);
			oLang.send();
			oLang.onreadystatechange = e=>{
				if (oLang.readyState == 4 && oLang.status == 200){
					try{
						var json = JSON.parse(oLang.responseText);
						//console.dir(json);
						this.localLang = json;
						if (cb) cb();
					}
					catch {
						console.error(url + " parsing error");
						if (cb) cb();
					}
				}
				else {
					if (cb) cb();
				}
			}
		},
		reset:function(){
			this.localLang = null;
		}
	};

	function nearLocaleBrower(list) {
		var userLang = navigator.language || navigator.userLanguage;
		if (userLang == null || userLang == "")
			return null;
		return nearLocale(list, userLang);
	}
	function nearLocale(list, userLang) {
		for (let l in list) {
			if (list[l] == userLang)
				return userLang;
		}
		var lang = userLang.split('-')[0];
		for (let l in list) {
			if (list[l].split('-')[0] == lang)
				return list[l];
		}
		var contry = userLang.split('-')[1];
		for (let l in list) {
			if (list[l].split('-')[1] == contry)
				return list[l];
		}
		return null;
	}

	function wLangusage( json, cb ){
		return new wl(json, cb);
	}
	wLangusage.version = version;
	wLangusage.nearLocaleBrower = nearLocaleBrower;
	wLangusage.nearLocale = nearLocale;

	var R5;
	if ( typeof exports != 'undefined' )
		R5 = exports.R5 ? exports.R5 : (exports.R5={});
	else
		R5 = window.R5 ? window.R5 : (window.R5={});

	R5.wLang = wLangusage;
})();
