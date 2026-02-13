/*
 * Remote5 wBase - 2022.11.22
 * Author : Willy.Lee (wiljwilj@hotmail.com)
 */
// 0.1.1 - 2021.10.08 - start
// 0.1.2 - 2022.11.22 - 

(function(){
"use strict";

var version = "0.1.2";

var w2a = {
	q: [],
	t: null,
	cpct: null,
	start: function(cap){
		var i = this;
		i.cpct = cap;
		setTimeout(function(){ procW2A(i); }, 0);
	},
	call: function(func, args){
		var i = this;
		i.q.push({ f: func, a: args });
		procW2A(i);
	}
};
function procW2A(i){
	if (i.t != null || i.q.length <= 0 || i.cpct == null)
		return;
	var c = i.q.shift();
	var a = c.a == null ? ":" : (":" + JSON.stringify(c.a).replace(/[\u007F-\uFFFF]/g, function(chr){ return "\\u" + ("0000" + chr.charCodeAt(0).toString(16)).substr(-4) }));
	var mcmd = "wBase:" + c.f + a;
	if (typeof (i.cpct) == "function")
		i.cpct(mcmd);
	else if (typeof (i.cpct) == "object")
		i.cpct.cmd(mcmd);
	else
		location.href = mcmd;
	i.t = setTimeout(function () { i.t = null; procW2A(i); }, 0);
}

function ret(id){
	var i = this;
	i.k = id;
}
ret.prototype = {
	close: function(l){
		var i = this;
		R5.wBase.cmd.close(i.k, l);
	}
};

var cmd = {
	l: [],
	x: 1,
	w2a: w2a,
	ret: ret,
	add: function(t, p, l){
		var i = this;
		var k = makeKey(i);
		p.__ID__ = k;
		i.l.unshift({ k: k, t: t, p: p, l: l });
		i.w2a.call(t, p);
		return new ret(k);
	},
	close: function(k, l){
		var i = this;
		var c = null, ix;
		for (ix in i.l) {
			if (i.l[ix].k == k) {
				c = i.l[ix];
				break;
			}
		}
		if (c) {
			if (l)
				c.l = l;
			c.x = true;
			i.w2a.call(c.t, k);
		}
	},
	remove: function(k){
		var i = this;
		for (var ix in i.l) {
			if (i.l[ix].k == k) {
				i.l.splice(ix, 1);
				break;
			}
		}
	},
	notify: function(k, a){
		var i = this;
		for (var ix in i.l) {
			if (i.l[ix].k == k) {
				var c = i.l[ix];
				if (c.x)
					a.state = "closed";
				if (c.l != undefined)
					c.l(a);
				if (a != null && a.state == "closed")
					i.remove(k);
				return;
			}
		}
	}
};

function makeKey(i){
	var cx = i.x;
	do {
		var x = cx;
		for (var c in i.l) {
			if (i.l[c].k == cx) {
				cx++;
				break;
			}
		}
	} while (x != cx);
	i.x = cx + 1;
	if (i.x > 0x7ffe)
		i.x = 1;
	return cx;
}
	
var evt = {
	l:[],
	add: function( t, l ){
		var i = this;
		i.l.unshift({t:t,l:l});
		var ix, cnt = 0;
		for ( ix in i.l ) { if ( i.l[ix].t == t ) cnt++; }
		return cnt;
	},
	remove: function( t, l ){
		var i = this;
		var ix, cnt = 0;
		for ( ix in i.l ) {
			if ( i.l[ix].t == t && i.l[ix].l == l ) {
				i.l.splice(ix, 1);
				break;
			}
		}
		for ( ix in i.l ) {
			if ( i.l[ix].t == t )
				cnt++;
		}
		return cnt;
	},
	evt_lastest_state:null,
	event: function( t, a ){
		var i = this;
		if ( t == "state" )
		{
			if ( a.state == 'start' || a.state == 'resume' || a.state == 'pause' || a.state == 'stop' )
				i.evt_lastest_state = a;
			else
			{
				if ( i.evt_lastest_state == null )
					i.evt_lastest_state = {};
				for ( var ak in a )
					if ( ak != 'state' )
						i.evt_lastest_state[ak] = a[ak];
			}
		}
		for ( var ix in i.l ) {
			if ( i.l[ix].t == t ) {
				if ( i.l[ix].l(a, t) )
					return true;
			}
		}
	}
};

var R5;
if (typeof exports != 'undefined')
	R5 = exports.R5 ? exports.R5 : (exports.R5 = {});
else
	R5 = window.R5 ? window.R5 : (window.R5 = {});

R5.wBase = {
	w2a: w2a,
	cmd: cmd,
	evt: evt,
	
	version: version
};
// command( cmd, params, listener )
// cmd: command
R5.command = function(cmd, params, listener){
	return R5.wBase.cmd.add(cmd, params, listener);
}
// addEventListener( type, listener )
// type: keyBack, starting, ...
R5.addEventListener = function( type, listener ){
	if ( R5.wBase.evt.add(type, listener) == 1 )
		R5.wBase.w2a.call("event", {type:type,use:true});
}
R5.removeEventListener = function( type, listener ){
	if ( R5.wBase.evt.remove(type, listener) == 0 )
		R5.wBase.w2a.call("event", {type:type,use:false});
}

R5.exitApp = function(){
	R5.command("EXIT_APP", {});
}
})();
