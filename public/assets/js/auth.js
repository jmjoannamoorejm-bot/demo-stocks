(function () {
  const form = document.querySelector('[data-auth-form]');
  if (!form) return;

  const mode = form.getAttribute('data-auth-mode');
  const message = form.querySelector('[data-form-message]');

  function setMessage(text, type) {
    message.textContent = text;
    message.className = `form-message ${type || ''}`.trim();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setMessage('');

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    try {
      const endpoint = mode === 'register' ? '/api/register' : '/api/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Unable to proceed.', 'error');
        return;
      }

      setMessage(mode === 'register' ? 'Account created. Redirecting...' : 'Login successful. Redirecting...', 'success');
      window.setTimeout(() => {
        window.location.href = '/dashboard';
      }, 600);
    } catch (error) {
      setMessage(error.message || 'Network error. Try again.', 'error');
    }
  });
})();
