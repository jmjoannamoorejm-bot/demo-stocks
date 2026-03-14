(function () {
  const slides = Array.from(document.querySelectorAll('[data-slide]'));
  const dots = Array.from(document.querySelectorAll('[data-dot]'));
  let index = 0;

  function renderSlide(next) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === next);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === next);
    });
  }

  if (slides.length > 1) {
    renderSlide(index);
    setInterval(() => {
      index = (index + 1) % slides.length;
      renderSlide(index);
    }, 3200);
  }

  const newsletterForm = document.querySelector('[data-newsletter]');
  if (newsletterForm) {
    const message = newsletterForm.querySelector('[data-newsletter-message]');

    newsletterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = newsletterForm.querySelector('input[name="email"]');

      if (!email.value.includes('@')) {
        message.textContent = 'Enter a valid email address.';
        message.className = 'form-message error';
        return;
      }

      message.textContent = 'Subscribed successfully.';
      message.className = 'form-message success';
      newsletterForm.reset();
    });
  }
})();
