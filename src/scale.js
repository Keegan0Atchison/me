function adjustScale() {
    const wrapper = document.getElementById('scale-wrapper');

    if (!wrapper) {
        return;
    }

    const screenWidth = window.innerWidth;
    const designWidth = 1280;
    const scale = screenWidth / designWidth;

    if (screenWidth < designWidth) {
        wrapper.style.transform = `scale(${scale})`;
        document.body.style.height = `${wrapper.offsetHeight * scale}px`;
    } else {
        wrapper.style.transform = 'none';
        document.body.style.height = 'auto';
    }
}

window.addEventListener('resize', adjustScale);
window.addEventListener('load', adjustScale);
