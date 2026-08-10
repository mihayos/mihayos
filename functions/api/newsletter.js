import { ensureDatabase, getJsonBody, jsonResponse } from './_shared.js';

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405);
  }

  try {
    const payload = await getJsonBody(request);
    const email = String(payload.email || '').trim();

    if (!email) {
      return jsonResponse({ ok: false, message: 'Email is required' }, 400);
    }

    const db = await ensureDatabase(env);
    if (db) {
      try {
        await db.prepare(`INSERT INTO newsletters (email) VALUES (?)`).bind(email).run();
      } catch (error) {
        if (!String(error.message || '').includes('UNIQUE')) {
          throw error;
        }
      }
    }

    return jsonResponse({ ok: true, message: 'Subscribed successfully' });
  } catch (error) {
    return jsonResponse({ ok: false, message: error.message || 'Unable to subscribe' }, 500);
  }
}
