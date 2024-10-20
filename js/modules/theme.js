// get browser theme preference
function getBrowserThemePreference() {

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    } else {
        return 'light';
    }

}


function setTheme(theme) {

    if (theme == null) {
        theme = getBrowserThemePreference();
    }
    localStorage.setItem('theme', theme);

    updateTheme();

}
// update theme tag
function updateTheme() {

    document.querySelectorAll(".print").forEach(name => {
        if (name.classList.contains("light")) {
            name.classList.remove("light");
        }
        if (name.classList.contains("dark")) {
            name.classList.remove("dark");
        }
        name.classList.add(localStorage.getItem('theme'));

    });
}
function updateTheme() {

    if (localStorage.getItem('theme') == null) {
        localStorage.setItem('theme', getBrowserThemePreference());
    }
    const currentTheme = localStorage.getItem('theme');

    // query every elements with class 'print'
    document.querySelectorAll(".print").forEach(element => {
        // Remove both classes
        element.classList.remove("light", "dark");
        // Add the current theme
        element.classList.add(currentTheme);
    });

}
