(() => {
    function applyRightColumnGuards() {
        const root = document.documentElement;
        const header = document.querySelector('.global-header');

        if (!header) {
            return;
        }

        const rootContainer = document.getElementById('root-container');
        const containerRect = rootContainer
            ? rootContainer.getBoundingClientRect()
            : { top: 0 };

        const headerRect = header.getBoundingClientRect();
        const headerBottomInContainer = headerRect.bottom - containerRect.top;
        const headerBottomInViewport = headerRect.bottom;
        const clearanceGap = 16;

        const rightContent = document.querySelector('.right-content');
        if (rightContent) {
            const rightRect = rightContent.getBoundingClientRect();
            const rightTopInContainer = rightRect.top - containerRect.top;
            const requiredTop = headerBottomInContainer + clearanceGap;
            const offset = Math.max(0, Math.ceil(requiredTop - rightTopInContainer));
            root.style.setProperty('--right-column-offset', `${offset}px`);
        } else {
            root.style.setProperty('--right-column-offset', '0px');
        }

        const workList = document.querySelector('.work-list');
        if (workList) {
            const workRect = workList.getBoundingClientRect();
            if (workRect.top < headerBottomInViewport + clearanceGap) {
                root.style.setProperty(
                    '--right-column-top',
                    `${Math.ceil(headerBottomInViewport + clearanceGap)}px`
                );
            } else {
                root.style.removeProperty('--right-column-top');
            }
        }
    }

    function runGuard() {
        window.requestAnimationFrame(applyRightColumnGuards);
    }

    window.addEventListener('resize', runGuard);
    window.addEventListener('orientationchange', runGuard);
    window.addEventListener('load', runGuard);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(runGuard);
    }
    runGuard();
})();