/*
 * Remote5 virtual app (wBase emulator) - 2022.11.22
 * Author : Willy.Lee (wiljwilj@hotmail.com)
 */
// 0.1.1 - 2021.10.10 - start
// 0.1.2 - 2022.11.22 - 

(function(){
"use strict";

var version = "0.1.2";

function wBaseVApp( wBase, cb_evt, arg )
{
	var i = this;
	i.wBase = wBase;
	i.cb_evt = cb_evt;
	i.event = {};
	i.state = "resumed";
	if ( i.wBase != null )
	{
		arg.device.state = "start";
		i.wBase.evt.event("state",arg.device);
		i.wBase.evt.event("state",{state:"resume"});
	}
}
wBaseVApp.prototype = {
	cmd: function( cmd ){
		var i = this;
		if ( cmd.indexOf("wBase:") != 0 )
		{
			alert("wBase error> " + cmd);
			return;
		}
		cmd = cmd.substr(6);

		var d = cmd.indexOf(":");
		var c = cmd.substr(0, d);
		var a = cmd.substr(d + 1);
		switch ( c )
		{
		case "event":
			var evt = JSON.parse(a);
			if ( evt.type == "keyBack" )
				i.event.keyBack = evt.use;
			else if ( evt.type == "state" )
				i.event.state = evt.use;
			else
				console.log("event : " + evt.type);
			break;
		default:
			if (parseInt(a) == a) {
				if ( i.cb_evt )
					i.cb_evt({ type:c, args:parseInt(a) });
			}
			else {
				var evt = JSON.parse(a);
				if ( i.cb_evt )
					i.cb_evt({ type:c, args:evt });
			}
			break;
		}
	},
	keyEvent: function( key ){
		var i = this;
		if ( key == "back" )
		{
			if ( i.event.keyBack )
				i.wBase.evt.event("keyBack");
			else
			{
				if ( i.cb_evt )
					i.cb_evt({ type:"state", state:"close" });
			}
		}
	},
	setState: function( state, environment ){
		var i = this;
		if ( state == "start" )
		{
			if ( i.state == "stopped" )
			{
				i.state = "started";
				if ( i.wBase != null )
				{
					i.wBase.evt.event("state",{state:"start"});
				}
			}
		}
		else if ( state == "resume" )
		{
			if ( i.state == "stopped" )
			{
				i.state = "resumed";
				if ( i.wBase != null )
				{
					i.wBase.evt.event("state",{state:"start"});
					i.wBase.evt.event("state",{state:"resume"});
				}
			}
			else if ( i.state == "started" )
			{
				i.state = "resumed";
				if ( i.wBase != null )
				{
					i.wBase.evt.event("state",{state:"resume"});
				}
			}
		}
		else if ( state == "pause" )
		{
			if ( i.state == "resumed" )
			{
				i.state = "started";
				if ( i.wBase != null )
					i.wBase.evt.event("state",{state:"pause"});
			}
		}
		else if ( state == "stop" )
		{
			if ( i.state == "started" )
			{
				i.state = "stopped";
				if ( i.wBase != null )
					i.wBase.evt.event("state",{state:"stop"});
			}
			else if ( i.state == "resumed" )
			{
				i.state = "stopped";
				if ( i.wBase != null )
				{
					i.wBase.evt.event("state",{state:"pause"});
					i.wBase.evt.event("state",{state:"stop"});
				}
			}
		}
		else if ( state == "environment" )
		{
			environment.state = "environment";
			if ( i.wBase != null )
				i.wBase.evt.event("state",environment);
		}
	},
	getState: function(){
		var i = this;
		return i.state;
	},
	notify: function( key, cmd ){
		var i = this;
		i.wBase.cmd.notify(key, cmd);
	}
};
wBaseVApp.version = version;

var R5;
if (typeof exports != 'undefined')
	R5 = exports.R5 ? exports.R5 : (exports.R5 = {});
else
	R5 = window.R5 ? window.R5 : (window.R5 = {});

R5.wBaseVApp = wBaseVApp;
})();
