// get browser language preference
function getBrowserLanguagePreference() {
    var stored = localStorage.getItem('language');
    if (stored) return stored;

    const language = navigator.languages ? navigator.languages[0] : navigator.language;
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
    localStorage.setItem('language', language);
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

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(element) {

        const key = element.getAttribute('data-i18n-placeholder');
        
        element.placeholder = i18next.t(key);
    
    });

}
