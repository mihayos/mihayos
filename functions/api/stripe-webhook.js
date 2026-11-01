import { ensureDatabase, jsonResponse } from './_shared.js';

// Verifies that the request really came from Stripe (HMAC-SHA256 of "timestamp.payload").
async function verifyStripeSignature(payload, header, secret, toleranceSec = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((p) => { const i = p.indexOf('='); return [p.slice(0, i), p.slice(i + 1)]; })
  );
  const timestamp = parts.t;
  const signatures = header.split(',').filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!timestamp || !signatures.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > toleranceSec) return false;

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');

  return signatures.some((sig) => {
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  });
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405);
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return jsonResponse({ ok: false, message: 'Webhook not configured' }, 500);
  }

  // Must be the RAW body, exactly as Stripe sent it.
  const payload = await request.text();
  const valid = await verifyStripeSignature(
    payload, request.headers.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET
  );
  if (!valid) return jsonResponse({ ok: false, message: 'Invalid signature' }, 400);

  try {
    const event = JSON.parse(payload);
    const db = await ensureDatabase(env);

    if (db && (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded')) {
      const s = event.data.object;
      if (s.payment_status === 'paid') {
        // INSERT OR IGNORE: Stripe may resend an event; session_id is UNIQUE so it's saved once.
        await db.prepare(`
          INSERT OR IGNORE INTO payments
            (session_id, payment_intent, customer_name, customer_email, customer_phone,
             package, quantity, amount, currency, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          s.id,
          s.payment_intent || '',
          s.customer_details?.name || '',
          s.customer_details?.email || '',
          s.customer_details?.phone || '',
          s.metadata?.package || '',
          parseInt(s.metadata?.quantity, 10) || 1,
          (s.amount_total || 0) / 100,
          (s.currency || 'usd').toUpperCase(),
          'paid'
        ).run();
      }
    }

    if (db && event.type === 'charge.refunded') {
      const pi = event.data.object.payment_intent;
      if (pi) await db.prepare("UPDATE payments SET status = 'refunded' WHERE payment_intent = ?").bind(pi).run();
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    // Non-2xx makes Stripe retry later.
    return jsonResponse({ ok: false, message: err.message || 'Webhook error' }, 500);
  }
}
