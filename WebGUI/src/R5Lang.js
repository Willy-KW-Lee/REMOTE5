import R5 from './R5';

if (R5.lang_handles == null)
  R5.lang_handles = [];
/*
// text align
var s_language_right_align = {
	ar:true
};
var s_langRightAlign = false;
s_langRightAlign = s_language_right_align[langcode] == true;
*/
function Lang(key, section) {
  for (let idx = R5.lang_handles.length - 1; idx >= 0; idx--) {
    let v = R5.lang_handles[idx][1].From(key, section);
    if (v != null)
      return v;
  }

  return "[["+key+"]]";
}

//@@ default language
const c_defaultLocaleCode = "en-US"; 
var s_langCode = "en";
var s_countryCode = "US";

Lang.isRightAlign = e=>{
    return false;
  };

Lang.getDeviceCountryCode = e=>{
    return s_countryCode;
  };

Lang.matchLocaleCode = locale_code=>{
    let listLocale = JSON.parse(process.env.REACT_APP_LOCALECODES);
    let locale = R5.wLang.nearLocale(listLocale, locale_code);
    if (locale !== null)
      return locale;
    return c_defaultLocaleCode;
  };

Lang.Locale = (locale_code, cb)=>{
    let locale_code_matched = Lang.matchLocaleCode(locale_code);
    if (locale_code_matched !== locale_code) {
      R5.Trace("Lang().Locale - "+locale_code+" => "+locale_code_matched);
      locale_code = locale_code_matched;
    }
    else {
      R5.Trace("Lang().Locale - "+locale_code);
    }
    if (c_defaultLocaleCode === locale_code)
      R5.lang_handles.forEach(o=>{o[1].reset()});
    else if (locale_code !== s_langCode+"-"+s_countryCode) {
      R5.lang_handles.forEach(o=>{
        o[1].load(o[0]+locale_code+".json", cb);
      })
    }
    s_langCode = locale_code.substr(0, 2);
    s_countryCode = locale_code.substr(3);
  };

Lang.Add = (prefix, cb, json)=>{
    let lang;
    if (c_defaultLocaleCode === s_langCode+"-"+s_countryCode) {
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
    R5.lang_handles.push([prefix,lang]);
    return lang;
  };

Lang.Remove = handle=>{
    let idx = R5.lang_handles.length;
    for (--idx; idx >= 0; idx--) {
      if (Object.is(R5.lang_handles[idx][1], handle))
        R5.lang_handles.splice(idx, 1);
    }
  };

export default Lang;