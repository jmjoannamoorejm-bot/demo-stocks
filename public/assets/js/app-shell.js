(function () {
  const nav = document.querySelector('[data-nav]');
  const navLinks = document.querySelectorAll('[data-nav-link]');
  const menuBtn = document.querySelector('[data-nav-toggle]');
  const supportPhone = '447401550182';
  const supportHref = `https://wa.me/${supportPhone}?text=${encodeURIComponent(
    'Hello support team, I need assistance.',
  )}`;

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

  if (!document.querySelector('[data-support-chat-fab]')) {
    const chatFab = document.createElement('a');
    chatFab.href = supportHref;
    chatFab.target = '_blank';
    chatFab.rel = 'noopener noreferrer';
    chatFab.className = 'support-chat-fab';
    chatFab.setAttribute('data-support-chat-fab', 'true');
    chatFab.setAttribute('aria-label', 'Chat with support on WhatsApp');
    chatFab.title = 'Chat Support';
    chatFab.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C7.03 3 3 6.84 3 11.58c0 2.41 1.05 4.58 2.73 6.12L4.65 21l3.5-.95A9.46 9.46 0 0 0 12 20.16c4.97 0 9-3.84 9-8.58S16.97 3 12 3zm0 15.4a7.8 7.8 0 0 1-3.32-.73l-.24-.12-2.07.56.62-1.84-.15-.23a6.7 6.7 0 0 1-1.07-3.66c0-3.63 3.02-6.6 6.73-6.6s6.73 2.97 6.73 6.6-3.02 6.6-6.73 6.6zm3.7-4.9c-.2-.1-1.15-.55-1.33-.62-.18-.06-.31-.1-.44.1-.12.2-.5.61-.61.73-.11.12-.23.14-.42.04-.2-.1-.83-.3-1.59-.97-.59-.52-.99-1.16-1.11-1.35-.12-.2-.01-.3.09-.4.08-.08.2-.22.3-.33.1-.11.13-.2.19-.33.06-.12.03-.24-.01-.34-.05-.1-.45-1.08-.62-1.47-.16-.39-.33-.33-.44-.34h-.38c-.12 0-.33.05-.5.24-.17.2-.66.64-.66 1.56s.68 1.8.78 1.93c.1.12 1.33 2.08 3.23 2.92.45.2.8.32 1.08.4.45.15.85.13 1.17.08.36-.05 1.15-.47 1.31-.92.16-.44.16-.82.11-.9-.05-.08-.18-.13-.38-.23z"/></svg><span>Chat Support</span>';
    document.body.appendChild(chatFab);
  }
})();
