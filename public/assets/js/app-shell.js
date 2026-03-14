(function () {
  const nav = document.querySelector('[data-nav]');
  const navLinks = document.querySelectorAll('[data-nav-link]');
  const menuBtn = document.querySelector('[data-nav-toggle]');

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  navLinks.forEach((link) => {
    const href = (link.getAttribute('href') || '').replace(/\/$/, '') || '/';
    if (href === currentPath || (href !== '/' && currentPath.startsWith(href))) {
      link.classList.add('active');
    }
  });
})();
