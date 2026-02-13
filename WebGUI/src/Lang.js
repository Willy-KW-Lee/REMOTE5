import R5 from './R5';

let handles = [];

const c_defaultLocaleCode = "en-US";
var s_langCode = "en";
var s_countryCode = "US";

let prototype = {
  isRightAlign:function() {
    return false;
  },
  getDeviceCountryCode:function() {
    return s_countryCode;
  },

  Locale:function(locale_code, cb) {
    console.log("Lang().Locale - "+locale_code);
    if (c_defaultLocaleCode == locale_code)
      handles.forEach(o=>{o[1].reset()});
    else if (locale_code != s_langCode+"-"+s_countryCode) {
      handles.forEach(o=>{
        o[1].load(o[0]+locale_code+".json", cb);
      })
    }
    s_langCode = locale_code.substr(0, 2);
    s_countryCode = locale_code.substr(3);
  },

  Add:function(prefix, cb, json) {
    let lang;
    if (c_defaultLocaleCode == s_langCode+"-"+s_countryCode) {
      lang = (json == null) ?
        R5.wLang(prefix+c_defaultLocaleCode+".json", cb) :
        R5.wLang(json, cb);
    }
    else {
      lang = (json == null) ?
        R5.wLang(prefix+c_defaultLocaleCode+".json") :
        R5.wLang(json);
      lang.load(prefix+s_langCode+"-"+s_countryCode+".json", cb);
    }
    handles.push([prefix,lang]);
    return lang;
  },
  Remove:function(handle) {
    let idx = handles.length;
    for (--idx; idx >= 0; idx--) {
      if (Object.is(handles[idx][1], handle))
        handles.splice(idx, 1);
    }
  }
}
/*
// text align
var s_language_right_align = {
	ar:true
};
var s_langRightAlign = false;
s_langRightAlign = s_language_right_align[langcode] == true;
*/
function Lang(key, section) {
  if (key == null)
    return prototype;
  for (let idx = handles.length - 1; idx >= 0; idx--) {
    let v = handles[idx][1].From(key, section);
    if (v != null)
      return v;
  }

  return "[["+key+"]]";
}

export default Lang;