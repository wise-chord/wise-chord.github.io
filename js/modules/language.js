// get browser language preference
function getBrowserLanguagePreference() {
    
    // read browser configuration infomation
    const language = navigator.languages ? navigator.languages[0] : navigator.language;
    
    // format return
    if (language == "zh" || language == "zh-CN"){
        return "zh_CN";
    }else if (language == "zh-TW"){
        return "zh_TW";
    }else if (language == "ja"){
        return "ja_JP";
    }else {
        return "en_GB";
    }

}



// set language
function setLanguage(language) {
    i18next.changeLanguage(language, function(err, t) {
        if (err) return console.error('Something went wrong loading', err);
        updateLanguage();
    });
}

// update content language
function updateLanguage() {

    document.querySelectorAll('[data-i18n]').forEach(function(element) {

        const key = element.getAttribute('data-i18n');
        
        element.innerHTML = i18next.t(key);
    
    });

}
