(() => {
    const menu = document.querySelector('.management-menu');
    if (!menu) return;
    const mobile = window.matchMedia('(max-width: 760px)');
    const adapt = () => { menu.open = !mobile.matches; };
    adapt();
    mobile.addEventListener('change', adapt);
})();
