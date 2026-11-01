import { jsonResponse, getJsonBody } from './_shared.js';

// Prices live on the SERVER so customers can't change them in the browser.
// Amounts are USD per person (Private Safari: per vehicle per day).
const PACKAGES = {
  'quick-escape-2d':   { name: '2-Day Quick Escape',          price: 680 },
  'crater-highlights': { name: '3-Day Crater Highlights',     price: 980 },
  'northern-taste':    { name: '4-Day Northern Taste',        price: 1620 },
  'classic-circuit':   { name: '5-Day Classic Circuit',       price: 2040 },
  'full-northern':     { name: '7-Day Full Northern Circuit', price: 2890 },
  'luxury-northern':   { name: 'Luxury Northern Circuit',     price: 6450 },
  'budget-camping':    { name: 'Budget Camping Safari',       price: 1180 },
  'honeymoon-beach':   { name: 'Honeymoon Safari & Beach',    price: 4120 },
  'family-safari':     { name: 'Family Safari',               price: 2340 },
  'group-departure':   { name: 'Group Departure Safari',      price: 1750 },
  'private-safari':    { name: 'Private Safari (per day)',    price: 3600 },
  'great-migration':   { name: 'Great Migration Safari',      price: 4480 }
};

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405);
  }
  if (!env.STRIPE_SECRET_KEY) {
    return jsonResponse({ ok: false, message: 'Payments are not configured yet' }, 500);
  }

  try {
    const body = await getJsonBody(request);
    const pkg = PACKAGES[String(body.package || '')];
    const qty = Math.min(Math.max(parseInt(body.quantity, 10) || 1, 1), 30);
    if (!pkg) return jsonResponse({ ok: false, message: 'Unknown package' }, 400);

    // Deposit share of the "from" price (default 30%). Change in Cloudflare: DEPOSIT_PERCENT
    const pct = Math.min(Math.max(parseFloat(env.DEPOSIT_PERCENT) || 30, 1), 100);
    const unitAmount = Math.round(pkg.price * 100 * (pct / 100)); // in cents

    const origin = new URL(request.url).origin;
    const form = new URLSearchParams();
    form.set('mode', 'payment');
    form.set('success_url', `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
    form.set('cancel_url', `${origin}/cancel.html`);
    form.set('line_items[0][quantity]', String(qty));
    form.set('line_items[0][price_data][currency]', 'usd');
    form.set('line_items[0][price_data][unit_amount]', String(unitAmount));
    form.set('line_items[0][price_data][product_data][name]', `${pct}% deposit — ${pkg.name}`);
    form.set('billing_address_collection', 'auto');
    form.set('phone_number_collection[enabled]', 'true');
    form.set('metadata[package]', pkg.name);
    form.set('metadata[quantity]', String(qty));

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: form
    });
    const session = await res.json();
    if (!res.ok) {
      return jsonResponse({ ok: false, message: session.error?.message || 'Stripe error' }, 502);
    }
    return jsonResponse({ ok: true, url: session.url });
  } catch (err) {
    return jsonResponse({ ok: false, message: err.message || 'Unable to start payment' }, 500);
  }
}
