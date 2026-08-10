import { ensureDatabase, getAdminCredentials, jsonResponse } from './_shared.js';

function getBasicAuthHeader(env) {
  const { username, password } = getAdminCredentials(env);
  return 'Basic ' + btoa(`${username}:${password}`);
}

export async function onRequest({ request, env }) {
  const expectedAuth = getBasicAuthHeader(env);
  const basicAuth = request.headers.get('authorization') || '';

  if (!basicAuth || basicAuth !== expectedAuth) {
    return new Response('Unauthorized', { status: 401, headers: { 'www-authenticate': 'Basic realm="Admin"' } });
  }

  if (request.method === 'GET') {
    try {
      const db = await ensureDatabase(env);
      const [inquiries, newsletters, packages, blogPosts] = await Promise.all([
        db.prepare('SELECT * FROM inquiries ORDER BY id DESC').all(),
        db.prepare('SELECT * FROM newsletters ORDER BY id DESC').all(),
        db.prepare('SELECT * FROM packages ORDER BY id DESC').all(),
        db.prepare('SELECT * FROM blog_posts ORDER BY id DESC').all()
      ]);

      return jsonResponse({ ok: true, inquiries, newsletters, packages, blogPosts });
    } catch (error) {
      return jsonResponse({ ok: false, message: error.message || 'Unable to load admin data' }, 500);
    }
  }

  if (request.method === 'POST') {
    try {
      const payload = await request.json();
      const db = await ensureDatabase(env);

      if (payload.action === 'create-package') {
        await db.prepare('INSERT INTO packages (name, duration, price, image_url) VALUES (?, ?, ?, ?)')
          .bind(payload.name, payload.duration, payload.price, payload.imageUrl || '')
          .run();
        return jsonResponse({ ok: true, message: 'Package created' });
      }

      if (payload.action === 'create-post') {
        await db.prepare('INSERT INTO blog_posts (title, status) VALUES (?, ?)')
          .bind(payload.title, payload.status || 'draft')
          .run();
        return jsonResponse({ ok: true, message: 'Blog post created' });
      }

      if (payload.action === 'update-status') {
        await db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').bind(payload.status, payload.id).run();
        return jsonResponse({ ok: true, message: 'Inquiry status updated' });
      }

      if (payload.action === 'update-package') {
        await db.prepare('UPDATE packages SET name = ?, duration = ?, price = ?, image_url = ? WHERE id = ?')
          .bind(payload.name, payload.duration, payload.price, payload.imageUrl || '', payload.id)
          .run();
        return jsonResponse({ ok: true, message: 'Package updated' });
      }

      if (payload.action === 'toggle-post') {
        const current = await db.prepare('SELECT status FROM blog_posts WHERE id = ?').bind(payload.id).first();
        const nextStatus = current?.status === 'published' ? 'draft' : 'published';
        await db.prepare('UPDATE blog_posts SET status = ? WHERE id = ?').bind(nextStatus, payload.id).run();
        return jsonResponse({ ok: true, message: 'Post status updated', status: nextStatus });
      }

      return jsonResponse({ ok: false, message: 'Unsupported action' }, 400);
    } catch (error) {
      return jsonResponse({ ok: false, message: error.message || 'Unable to update admin data' }, 500);
    }
  }

  if (request.method === 'DELETE') {
    try {
      const payload = await request.json();
      const db = await ensureDatabase(env);

      if (payload.action === 'delete-inquiry') {
        await db.prepare('DELETE FROM inquiries WHERE id = ?').bind(payload.id).run();
        return jsonResponse({ ok: true, message: 'Inquiry deleted' });
      }

      if (payload.action === 'delete-package') {
        await db.prepare('DELETE FROM packages WHERE id = ?').bind(payload.id).run();
        return jsonResponse({ ok: true, message: 'Package deleted' });
      }

      if (payload.action === 'delete-post') {
        await db.prepare('DELETE FROM blog_posts WHERE id = ?').bind(payload.id).run();
        return jsonResponse({ ok: true, message: 'Post deleted' });
      }

      return jsonResponse({ ok: false, message: 'Unsupported action' }, 400);
    } catch (error) {
      return jsonResponse({ ok: false, message: error.message || 'Unable to delete admin data' }, 500);
    }
  }

  return jsonResponse({ ok: false, message: 'Method not allowed' }, 405);
}
