
// update content language
function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(function(element) {
        const key = element.getAttribute('data-i18n');
        element.innerHTML = i18next.t(key);
    });
}

// get browser language preference
function getBrowserLanguagePreference() {
    
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
