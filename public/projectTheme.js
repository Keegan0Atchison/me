(() => {
    const root = document.documentElement;

    function resolveTheme() {
        const params = new URLSearchParams(window.location.search);
        return params.get('theme') || localStorage.getItem('theme') || 'dark';
    }

    function updateNavThemeLinks(theme) {
        document.querySelectorAll('nav a').forEach((link) => {
            const href = link.getAttribute('href');
            if (!href) {
                return;
            }

            const url = new URL(href, window.location.href);
            url.searchParams.set('theme', theme);
            link.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
        });
    }

    function applyTheme(theme, { updateLinks = true } = {}) {
        if (theme === 'dark') {
            root.style.setProperty('--bg-white', '#1a1a1a');
            root.style.setProperty('--text-grey', '#cccccc');
            root.classList.add('dark-mode');
            root.style.setProperty('background-color', '#1a1a1a', 'important');
            if (document.body) {
                document.body.classList.add('dark-mode');
                document.body.style.setProperty('background-color', '#1a1a1a', 'important');
            }
        } else {
            root.style.setProperty('--bg-white', '#ffffff');
            root.style.setProperty('--text-grey', '#555555');
            root.classList.remove('dark-mode');
            root.style.setProperty('background-color', '#ffffff', 'important');
            if (document.body) {
                document.body.classList.remove('dark-mode');
                document.body.style.setProperty('background-color', '#ffffff', 'important');
            }
        }

        localStorage.setItem('theme', theme);

        if (updateLinks) {
            updateNavThemeLinks(theme);
        }
    }

    window.applyProjectTheme = applyTheme;

    applyTheme(resolveTheme(), { updateLinks: false });

    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(resolveTheme(), { updateLinks: true });
    });
})();
