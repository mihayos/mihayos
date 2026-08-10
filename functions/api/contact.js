import { ensureDatabase, getJsonBody, jsonResponse } from './_shared.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405);
  }

  try {
    const payload = await getJsonBody(request);
    const name = String(payload.name || '').trim();
    const email = String(payload.email || '').trim();
    const phone = String(payload.phone || '').trim();
    const travelDates = String(payload.travelDates || payload.dates || '').trim();
    const message = String(payload.message || '').trim();

    if (!name || !email || !message) {
      return jsonResponse({ ok: false, message: 'Name, email and message are required' }, 400);
    }

    const db = await ensureDatabase(env);
    if (db) {
      await db.prepare(`
        INSERT INTO inquiries (name, email, phone, travel_dates, message)
        VALUES (?, ?, ?, ?, ?)
      `).bind(name, email, phone, travelDates, message).run();
    }

    return jsonResponse({ ok: true, message: 'Enquiry received successfully' });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message || 'Unable to save enquiry' }, 500);
  }
}
