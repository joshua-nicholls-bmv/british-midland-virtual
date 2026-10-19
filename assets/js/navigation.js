(() => {
    'use strict';
    const nav = document.querySelector('.bmv-nav');
    if (!nav) return;
    const toggle = nav.querySelector('.bmv-menu-toggle');
    const menu = nav.querySelector('.bmv-primary');
    const groups = [...nav.querySelectorAll('.bmv-dropdown')];
    const mobile = window.matchMedia('(max-width: 1000px)');
    function closeGroups(except) { groups.forEach(group => { if (group !== except) group.open = false; }); }
    function closeMenu() {
        menu.removeAttribute('data-open');
        toggle.setAttribute('aria-expanded','false');
        toggle.querySelector('span').textContent = 'Menu';
        closeGroups();
    }
    toggle.addEventListener('click',() => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        if (!open) {closeMenu();return;}
        menu.setAttribute('data-open','');
        toggle.setAttribute('aria-expanded','true');
        toggle.querySelector('span').textContent = 'Close';
    });
    groups.forEach(group => group.addEventListener('toggle',() => {if (group.open) closeGroups(group);}));
    nav.addEventListener('keydown',event => {
        if (event.key !== 'Escape') return;
        const openGroup = groups.find(group => group.open);
        if (openGroup) { openGroup.open=false;openGroup.querySelector('summary').focus(); }
        else if (mobile.matches && menu.hasAttribute('data-open')) {closeMenu();toggle.focus();}
    });
    document.addEventListener('click',event => {if (!nav.contains(event.target)) closeMenu();});
    nav.addEventListener('focusout',event => {if (event.relatedTarget && !nav.contains(event.relatedTarget)) closeGroups();});
    mobile.addEventListener('change',closeMenu);
    closeMenu();
    nav.classList.add('nav-ready');
})();
