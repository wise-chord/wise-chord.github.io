// i18next init
i18next.use(i18nextXHRBackend).init({
    // default lang
    lng: getBrowserLanguagePreference(),
    backend: {
        loadPath: 'locales/{{lng}}.json'
    }
}, function(err, t) {
    // update the page after init
    updateLanguage();
});





// init
function init(){
    
    // theme init
    setTheme(localStorage.getItem('theme'));

}