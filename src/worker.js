// Entry point for `wrangler deploy` (Cloudflare Worker + static assets).
// Routes /api/* to the same handlers that live in functions/api/.
import * as health from '../functions/api/health.js';
import * as contact from '../functions/api/contact.js';
import * as admin from '../functions/api/admin.js';
import * as newsletter from '../functions/api/newsletter.js';
import * as checkout from '../functions/api/create-checkout-session.js';
import * as stripeWebhook from '../functions/api/stripe-webhook.js';

const routes = {
  '/api/health': health,
  '/api/contact': contact,
  '/api/admin': admin,
  '/api/newsletter': newsletter,
  '/api/create-checkout-session': checkout,
  '/api/stripe-webhook': stripeWebhook
};

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    const route = routes[pathname.replace(/\/+$/, '')];
    if (route) return route.onRequest({ request, env, ctx });
    // Anything else (html, css, images…) is served as a static file.
    return env.ASSETS.fetch(request);
  }
};
