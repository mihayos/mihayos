// Sends the visitor to Stripe Checkout. No keys live in the browser.
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-pay]');
  if (!btn) return;
  e.preventDefault();

  const perDay = btn.dataset.pay === 'private-safari';
  const answer = window.prompt(perDay ? 'How many days?' : 'How many travelers?', '2');
  if (answer === null) return;
  const quantity = Math.max(1, parseInt(answer, 10) || 1);

  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: btn.dataset.pay, quantity })
    });
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (data && data.ok && data.url) { window.location.href = data.url; return; }
    if (!data) {
      alert('Payment service not found (HTTP ' + res.status + '). The /api endpoint is not running on this site.');
    } else {
      alert(data.message || 'Could not start payment. Please try again.');
    }
  } catch (err) {
    alert('Network error. Are you opening the page from a file? Use the deployed site or "npm run dev".');
  }
  btn.disabled = false;
  btn.textContent = label;
});
