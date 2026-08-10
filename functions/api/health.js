import { jsonResponse } from './_shared.js';

export async function onRequest() {
  return jsonResponse({
    ok: true,
    message: 'Mihayo Safaris API is online',
    service: 'cloudflare-pages-functions'
  });
}
