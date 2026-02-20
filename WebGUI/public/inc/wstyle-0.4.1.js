/*
 * Remote5 wStyle - 2021.10.13~
 * Author : Willy.Lee (wiljwilj@hotmail.com)
 */
// 0.1.1 - 2021.10.13
// 0.2.0 - 2022.03.09 - wstyle=""
// 0.3.0 - 2022.11.22 - add style type="text/wcss", add link rel="wstylesheet", remove function type
// 0.3.1 - 2022.12.12 - loading wcss after load, add data-wstyle=""
// 0.3.2 - 2023.06.06 - bugfix: parsing key:v1:v2 to key + v1:v2 (add _toKV)
// 0.3.3 - 2023.09.16 - add R5.wStyle.load <url>, cb(object)
// 0.4.0 - 2026.02.16 - media query css support
// 0.4.1 - 2026.02.20 - stop formula support

(function(){
	"use strict";
	
	var version = "0.4.0";
	
	function ws( style ) {
		var i = this;
		var d = document;
		var s = i.ele = d.createElement("style");
		d.head.appendChild(s);
		i.stylesheet = s.sheet;
		i.cssRules = s.sheet.cssRules;
		
		if (style == null)
			style = "";
		else if (typeof style !== "string" && typeof style !== "object")
			style = style.toString();
		i.style = style;
	
		i.updateScreenDensity(R5.screenDensity);
	}
	ws.prototype = {
		updateScreenDensity:function( sd ){
			_updateScreenDensity(this, sd);
		},
		
		destroy:function(){
			var i = this;
			for (var idx = R5.wStyle.styles.length - 1; idx >= 0; idx--) {
				if (R5.wStyle.styles[idx] == this)
					R5.wStyle.styles.splice(idx, 1);
			}
			
			i.stylesheet.disabled = true;
			document.head.removeChild(i.ele);
			i.ele = null;
			i.stylesheet = null;
			i.cssRules = null;
		}
	};
	
	function _fromRules( i, sel ) {
		sel = sel.toLowerCase().replace(/^\s+|\s+$/gm,'');
		
		for (var idx = i.cssRules.length - 1; idx >= 0; idx--) {
			var rule = i.cssRules[idx];
			if (rule.selectorText === sel)
				return rule;
		}
	}
	
	function _evalValue( v, sd ) {
		var v1 = v.replace(/screenDensity/gi, sd);
		var v2 = v1.replace(/s?[\-0-9.]*dp+/gi, function(mtch) {
			var mm = mtch.replace(/dp/gi, "*"+sd);
			try {
				mm = eval(mm) + "px";
			} catch (e) {
				mm = mtch;
			}
			return mm;
		});
		var v3 = v2.replace(/s?[\-0-9.]*px+/gi, function(mtch) {
			var mm = mtch.replace(/px$/gi, "");
			try {
				mm = eval(mm) + "px";
			} catch (e) {
				mm = mtch;
			}
			return mm;
		});
		return v3;
	}
	
	function _toKV( s ) {
		var n = s.indexOf(":");
		if (n <= 0) return null;
		return [s.substring(0, n).replace(/^\s+|\s+$/g,""),
				s.substring(n+1).replace(/^\s+|\s+$/g,"")];
	}
	
	function _updateWStyleInElements( eles, sd ) {
		for (var idx = 0; idx < eles.length; idx++) {
			var ele = eles[idx];
			var wstyle = ele.getAttribute("wstyle");
			if (wstyle == null)
				wstyle = ele.getAttribute("data-wstyle");
			if (wstyle) {
				var ss = wstyle.split(/\s*;\s*/);
				ss.forEach(function( s ){
					var pv = _toKV(s);
					if (pv == null)
						return;
					var val = _evalValue(pv[1], sd);
					ele.style[pv[0]] = val;
				});
			}
			_updateWStyleInElements(ele.children, sd);
		}
	}
	
	function _strstyle2obj( str ){
		var spvs = str.split(/\s*}\s*/);
		var ispv = 0;
		var espv = spvs.length - 1;

		var oESs = {};
		while (ispv < espv) {
			var spv = spvs[ispv];
			spv = spv.split(/\s*{\s*/);
			ispv = _rstrstyle2obj(spvs, ispv, espv, spv, oESs);
		}
		return oESs;
	}
	function _rstrstyle2obj(spvs, ispv, espv, spv, oESs){
		var sel = spv.length < 2 ? "" : spv[0].replace(/\/\/.*/gm, '').replace(/\s+/gm, ' ').replace(/^\s+|\s+$/gm,'');
		if (sel === "")
			return ispv+1;
		if (spv.length === 2) {
			_strkeyvalue(sel, spv[1], oESs);
			return ispv+1;
		}
		else {
			var oSss = {}
			oESs[sel] = oSss;
			var spvss = spv.splice(1);
			ispv = _rstrstyle2obj(spvs, ispv, espv, spvss, oSss);
			while (ispv < espv) {
				var spv = spvs[ispv];
				if (spv === "")
					return ispv+1;
				spv = spv.split(/\s*{\s*/);
				ispv = _rstrstyle2obj(spvs, ispv, espv, spv, oSss);
			}
			return ispv;
		}
	}
	function _strkeyvalue(sel, styles, oESs){
		var oSs = {}
		oESs[sel] = oSs;
		try {
			styles = styles.replace(/^\s+|\s+$/gm,'');
			styles = styles.split(/\s*;\s*/);
			styles.forEach(function( s ){
				var pv = _toKV(s);
				if (pv == null)
					return;
				oSs[pv[0]] = pv[1];
			});
		} catch (e) {
			console.warn("wStyle: can't apply css - "+sel);
		}
	}
	
	function _updateScreenDensity( i, sd ){
		var istyle = i.style;
		if (typeof istyle == "string") {
			istyle = _strstyle2obj(istyle);
		}
	
		for (var sel in istyle) {
			var rule = _fromRules(i, sel);
			try {
				if (rule == null) {
					var idxR = i.cssRules.length;
					i.stylesheet.insertRule(sel+" {}", idxR);
					rule = i.cssRules[idxR];
				}
				
				var styles = istyle[sel];
				var prop, val, idxR2, rule2, prop2, val2;
				switch (rule.constructor.name)
				{
				case "CSSStyleRule":
					for (prop in styles) {
						val = styles[prop];
						val = _evalValue(val, sd);
						rule.style[prop] = val;
					}
					break;
				case "CSSMediaRule":
					for (prop in styles) {
						val = styles[prop];
						idxR2 = rule.cssRules.length;
						rule.insertRule(prop+" {}", idxR2);
						rule2 = rule.cssRules[idxR2];
						for (prop2 in val) {
							val2 = val[prop2];
							val2 = _evalValue(val2, sd);
							rule2.style[prop2] = val2;
						}
					}
					break;
				case "CSSKeyframesRule":
					for (prop in styles) {
						val = styles[prop];
						rule.appendRule(prop+" {}");
						rule2 = rule.cssRules[rule.cssRules.length - 1];
						for (prop2 in val) {
							val2 = val[prop2];
							val2 = _evalValue(val2, sd);
							rule2.style[prop2] = val2;
						}
					}
					break;
				default:
					throw new Error(1);
				}
			} catch (e) {
				console.warn("wStyle: can't apply json css - "+sel);
			}
		}
	}
	
	function wStyle( t ){
		var s = new ws(t);
		R5.wStyle.styles.push(s);
		return s;
	}
	wStyle.version = version;
	
	function updateStyleInElements(){
		var bds = document.getElementsByTagName("body");
		_updateWStyleInElements(bds, R5.screenDensity);
		
		var styles = document.getElementsByTagName("style");
		var idx = 0;
		for (; idx < styles.length; idx++) {
			var sty = styles[idx];
			if (sty.type == null || sty.type.toLowerCase() !== "text/wcss")
				continue;
			
			if (sty.R5_ws == null) {
				sty.R5_ws = new ws(sty.outerText);
			}
			sty.R5_ws.updateScreenDensity(R5.screenDensity);
		}
		
		var links = document.getElementsByTagName("link");
		for (idx = 0; idx < links.length; idx++) {
			var lnk = links[idx];
			if (lnk.rel == null || lnk.rel.toLowerCase() !== "wstylesheet")
				continue;
			
			if (lnk.R5_ws == null) {
				var wcss = new XMLHttpRequest();
				wcss.open("GET", lnk.href, true);
				wcss.send();
				wcss.onreadystatechange = function(){
					if (wcss.readyState == 4 && wcss.status == 200) {
						lnk.R5_ws = new ws(wcss.responseText);
						lnk.R5_ws.updateScreenDensity(R5.screenDensity);
					}
				}
			}
		}
	}

	function loadWcssFile(url, cb){
		var styleApp = new XMLHttpRequest();
		styleApp.open("GET", url, true);
		styleApp.send();
		styleApp.onreadystatechange = ()=>{
			if (styleApp.readyState == 4 && styleApp.status == 200)
				cb(R5.wStyle(styleApp.responseText));
	    }
	}
	
	function setScreenDensity( sd ){
		if (sd == null)
			sd = R5.screenDensity;
		else
			R5.screenDensity = sd;
		
		R5.wStyle.styles.forEach(function( s ){
			s.updateScreenDensity(sd);
		});
		
		updateStyleInElements();
	}
	
	
	var R5;
	if ( typeof exports != 'undefined' )
		R5 = exports.R5 ? exports.R5 : (exports.R5={});
	else
		R5 = window.R5 ? window.R5 : (window.R5={});
	
	R5.wStyle = wStyle;
	R5.wStyle.styles = [];
	R5.wStyle.updateStyleInElements = updateStyleInElements;
	R5.wStyle.load = loadWcssFile;
	R5.screenDensity = 1;
	R5.setScreenDensity = setScreenDensity;
	
	window.addEventListener("load", function(){ R5.setScreenDensity() });
})();
