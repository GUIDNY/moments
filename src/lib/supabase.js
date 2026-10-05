/**
 * Just enough Supabase to put a photograph in a bucket and get a URL back.
 *
 * The rest of this app has no backend and no SDKs, and one upload endpoint does
 * not justify starting either. Storage is a plain REST API: POST the bytes to
 * `/storage/v1/object/<bucket>/<path>`, and a public bucket then serves them
 * from `/storage/v1/object/public/<bucket>/<path>` forever. That is the whole
 * integration.
 *
 * XHR rather than fetch, because fetch still cannot report upload progress and
 * an agent on a phone uploading eight photographs deserves a bar that moves.
 */

const URL_BASE = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '');
export const BUCKET = String(import.meta.env.VITE_SUPABASE_BUCKET || 'tour-photos');

/**
 * Whether uploads can work at all. The build is static, so the keys are baked
 * in at build time — if they were missing then, no amount of retrying now will
 * help, and the UI says so plainly instead of failing one file at a time.
 */
export const storageReady = Boolean(URL_BASE && KEY);

/** The address a client's browser will fetch the photo from. */
export function publicUrl(path) {
  return `${URL_BASE}/storage/v1/object/public/${BUCKET}/${path}`;
}

/**
 * A name that cannot collide and cannot leak anything. Agents upload from
 * phones, where file names are `IMG_4412.HEIC` at best and the customer's name
 * at worst, so we keep only the extension.
 */
function objectPath(file) {
  const ext = (file.type.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 4) || 'jpg';
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${stamp}-${rand}.${ext}`;
}

/**
 * Upload one file. Resolves with its public URL.
 * `onProgress` gets 0…1 while the bytes go up.
 */
export function uploadPhoto(file, { onProgress, signal } = {}) {
  if (!storageReady) {
    return Promise.reject(new Error('storage-not-configured'));
  }

  const path = objectPath(file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${URL_BASE}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader('apikey', KEY);
    xhr.setRequestHeader('Authorization', `Bearer ${KEY}`);
    xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');
    // a tour link is shared for weeks; let the browser and the CDN keep the file
    xhr.setRequestHeader('cache-control', 'public, max-age=31536000, immutable');
    // never overwrite: the path is random, so a collision means something is wrong
    xhr.setRequestHeader('x-upsert', 'false');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(1);
        resolve(publicUrl(path));
      } else {
        reject(new Error(readError(xhr)));
      }
    };
    xhr.onerror = () => reject(new Error('network'));
    xhr.onabort = () => reject(new Error('aborted'));

    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    xhr.send(file);
  });
}

/**
 * Storage answers with JSON, but a proxy or a dead project answers with HTML.
 * Map the two failures an agent can actually act on; everything else is noise
 * they cannot do anything about, so it becomes a plain status code.
 */
function readError(xhr) {
  let body = {};
  try {
    body = JSON.parse(xhr.responseText);
  } catch {
    /* not JSON — fall through to the status code */
  }
  if (xhr.status === 404 && /bucket/i.test(body.message || '')) return 'bucket-missing';
  if (xhr.status === 400 && /row-level security|policy/i.test(body.message || '')) return 'not-allowed';
  if (xhr.status === 401 || xhr.status === 403) return 'not-allowed';
  if (xhr.status === 413) return 'too-large';
  return body.message || `http-${xhr.status}`;
}

/* The same project serves Stock City's accounts (`lib/auth.js`, `stocks/cloud.js`). */
export const SUPABASE_URL = URL_BASE;
export const SUPABASE_KEY = KEY;
