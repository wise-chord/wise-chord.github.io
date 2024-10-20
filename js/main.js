// i18next init
i18next.use(i18nextXHRBackend).init({
    // default lang
    lng: getBrowserLanguagePreference(),
    backend: {
        loadPath: 'locales/{{lng}}.json'
    }
}, function(err, t) {
    // update the page after init
    updateContent();
    setTheme(getBrowserTheme());
});

// get browser language preference
function getBrowserLanguagePreference() {
    const language = navigator.languages ? navigator.languages[0] : navigator.language;
    return language || 'en_GB';
}

// update content language
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

function setTheme() {
    document.body.classList.toggle('dark-mode');
    document.querySelector('.navbar').classList.toggle('dark-mode');
    document.querySelectorAll('.dropdown-button').forEach(button => button.classList.toggle('dark-mode'));
    document.querySelectorAll('.dropdown-content').forEach(content => content.classList.toggle('dark-mode'));
    document.querySelectorAll('.navbar a').forEach(link => link.classList.toggle('dark-mode'));
    document.querySelectorAll('button').forEach(button => button.classList.toggle('dark-mode'));
    document.querySelector('header').classList.toggle('dark-mode');
    document.querySelector('footer').classList.toggle('dark-mode');
}