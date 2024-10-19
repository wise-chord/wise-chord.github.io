// i18next init
i18next.use(i18nextXHRBackend).init({
    lng: 'en_GB', // 默认语言
    backend: {
        loadPath: 'locales/{{lng}}.json'
    }
}, function(err, t) {
    // 初始化完成后，更新页面内容
    updateContent();
});

function updateContent() {
    document.querySelectorAll('[data-i18n]').forEach(function(element) {
        const key = element.getAttribute('data-i18n');
        element.innerHTML = i18next.t(key);
    });
}

function setLanguage(language) {
    i18next.changeLanguage(language, function(err, t) {
        if (err) return console.error('Something went wrong loading', err);
        updateContent();
    });
}
