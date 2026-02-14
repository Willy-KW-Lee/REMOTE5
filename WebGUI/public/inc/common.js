
window.onload = function () {
  document.onselectstart = document.ondragstart = function() { return false; };

  updateLayout();

  window.R5.addEventListener("state", onState);

  r5_main();
}
window.onresize = updateLayout;

var densityScreen = null;
var physicalpixel_per_pixel = 1;
var heightKeyboard = 0;

function updateLayout()
{
  r5_resize(heightKeyboard);
}

function updateScreenDensity( density )
{
  densityScreen = density;
  physicalpixel_per_pixel = densityScreen ? (densityScreen / window.devicePixelRatio) : ($("html").width() / 360); // width=360px
//	document.documentElement.style.fontSize = (physicalpixel_per_pixel*100)+'px';

  if (window.R5 != null && window.R5.setScreenDensity != null)
    window.R5.setScreenDensity(physicalpixel_per_pixel);
  if (window.wRects != null)
    window.wRects.updateLayout();
  r5_screendensity(physicalpixel_per_pixel);
}

var s_started = false;
//var s_device_type = "";

function onState( args )
{
	trace("app state : " + JSON.stringify(args));
	if ( args.state == "start" )
	{
//		if ( args.device_type )
//			s_device_type = args.device_type;
	}
	else if ( args.state == "resume" )
	{
		if ( args.locale )
			r5_locale(args.locale);
		
		if ( args.screen_density )
      updateScreenDensity(args.screen_density);
    
    if ( !s_started )
    {
      s_started = true;
      r5_start();
    }
  }
	else if ( args.state == "environment" )
	{
		if ( args.locale )
			r5_locale(args.locale);
		
		if ( args.screen_density )
			updateScreenDensity(args.screen_density);
		
		if ( args.keyboard !== undefined )
		{
			if ( args.keyboard == 0 )
			{
				heightKeyboard = 0;
				r5_resize(heightKeyboard);
			}
			else if ( args.keyboard > 0 )
			{
				heightKeyboard = args.keyboard;
				r5_resize(heightKeyboard);
			}
		}
	}
	
	r5_state(args);
}

/* overridable */
function r5_main() {}
function r5_start() {}
function r5_state(args) {}
function r5_resize(keyboard) {}
function r5_screendensity(physicalpixel_per_pixel) {}
function r5_locale( locale_code ) {}


function toast( msg )
{
	//R5.command("SHOWTOAST", {msg:msg});
	alert(msg);//!!
}

function getCommandArguments() {
	var result = {};
	window.location.href.replace(/[?#&]{1}([^=&#]+)=([^&#]*)/g,
		function(s, k, v) { result[k] = decodeURIComponent(v); });
	return result;
}


function num2str( num ) {
	var num = num + "";
	for (var idx = num.length - 3; idx > 0; idx -= 3)
		num = num.substr(0, idx) + "," + num.substr(idx);
	return num;
}


function trace( str )
{
	//console.log(str);
}
