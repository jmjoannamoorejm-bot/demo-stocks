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

  function initMarketTicker() {
    const chips = Array.from(document.querySelectorAll('[data-market-chip]'));
    if (!chips.length) return;

    const money = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    });

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function drawSparkline(node, rising) {
      if (!node) return;
      const points = [];
      let y = rising ? 14 : 6;
      for (let i = 0; i < 9; i += 1) {
        const bias = rising ? -0.9 : 0.9;
        y = clamp(y + (Math.random() - 0.48) * 2.4 + bias, 2, 18);
        points.push(`${i * 9},${y.toFixed(2)}`);
      }
      node.setAttribute('points', points.join(' '));
    }

    function renderChip(chip) {
      const state = chip.__marketState;
      if (!state) return;

      const priceNode = chip.querySelector('[data-market-price]');
      const deltaNode = chip.querySelector('[data-market-delta]');
      const sparkline = chip.querySelector('[data-sparkline]');

      const isUp = state.delta >= 0;
      chip.classList.toggle('up', isUp);
      chip.classList.toggle('down', !isUp);
      if (deltaNode) {
        deltaNode.textContent = `${isUp ? '+' : ''}${state.delta.toFixed(2)}%`;
      }
      if (priceNode) {
        priceNode.textContent = money.format(state.price);
      }
      drawSparkline(sparkline, isUp);
    }

    chips.forEach((chip) => {
      chip.__marketState = {
        price: Number(chip.dataset.priceBase || 0),
        delta: Number(chip.dataset.deltaBase || 0),
      };
      renderChip(chip);
    });

    setInterval(() => {
      chips.forEach((chip) => {
        const state = chip.__marketState;
        if (!state) return;

        const symbol = String(chip.dataset.symbol || '').toUpperCase();
        const volatility = symbol === 'BTC' ? 210 : 1.4;
        state.price = Math.max(0.01, state.price + (Math.random() - 0.5) * volatility);
        state.delta = clamp(state.delta + (Math.random() - 0.5) * 0.34, -9.5, 9.5);
        renderChip(chip);
      });
    }, 3600);
  }

  function initReveal() {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    if (!nodes.length) return;

    nodes.forEach((node, i) => {
      node.style.setProperty('--reveal-delay', `${Math.min(i * 65, 520)}ms`);
    });

    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );

    nodes.forEach((node) => observer.observe(node));
  }

  function initCountups() {
    const nodes = Array.from(document.querySelectorAll('[data-countup]'));
    if (!nodes.length) return;

    function run(node) {
      if (node.dataset.countupStarted === 'true') return;
      node.dataset.countupStarted = 'true';

      const rawTarget = String(node.dataset.countup || '0').trim();
      const target = Number(rawTarget);
      if (!Number.isFinite(target)) return;

      const prefix = String(node.dataset.prefix || '');
      const suffix = String(node.dataset.suffix || '');
      const decimals = Number.isFinite(Number(node.dataset.decimals))
        ? Number(node.dataset.decimals)
        : rawTarget.includes('.')
          ? rawTarget.split('.')[1].length
          : 0;

      const duration = 900;
      const startedAt = performance.now();

      function frame(now) {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        node.textContent = `${prefix}${value.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}${suffix}`;
        if (progress < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
    }

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(run);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          run(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 },
    );

    nodes.forEach((node) => observer.observe(node));
  }

  initMarketTicker();
  initReveal();
  initCountups();

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
