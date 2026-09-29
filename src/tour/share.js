/**
 * The whole property lives in the link. No backend, no accounts — an agent
 * fills the form, gets a URL, and sends it on WhatsApp. Base64url over UTF-8,
 * because the text is Hebrew and `btoa` alone chokes on it.
 *
 * Since the survey moved into the spec, a link carries a description of every
 * room — its size, colours, floor and furniture — which is several kilobytes of
 * JSON, and several kilobytes is where chat apps start mangling links. So the
 * payload is gzipped first, which takes it back under a thousand characters.
 * The first character says how to read the rest: `z` gzipped, `j` plain. Links
 * made before any of this exist without a marker, so anything that starts with
 * neither is read the old way.
 */
export function encodeSpec(spec) {
  const bytes = new TextEncoder().encode(JSON.stringify(spec));
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSpec(encoded) {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function specFromLocation() {
  try {
    return decodeSpec(new URLSearchParams(window.location.search).get('p') || '');
  } catch {
    return null;
  }
}

/**
 * The link an agent copies. It points back at this very page with the property
 * in the query, so it works wherever the app is hosted — including behind a
 * single published URL with no file name at all.
 */
export function tourUrl(spec, base = window.location.origin + window.location.pathname) {
  // when the builder is served at /studio, hand out the prettier /tour address;
  // anywhere else (a bare published URL) the same page serves both, so leave it
  const path = base.replace(/\/studio(\.html)?$/, '/tour');
  return `${path}?p=${encodeSpec(spec)}`;
}

/** Israeli numbers come in as 05x…; WhatsApp wants 9725x…. */
export function whatsappLink(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  const intl = digits.startsWith('972') ? digits : digits.replace(/^0/, '972');
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

/**
 * Another page of this same app, wherever it happens to be served from.
 * Vercel's `cleanUrls` drops the extension, the dev server and a plain static
 * host keep it, and the build uses relative paths — so follow whatever form
 * the page we are on is already using rather than guessing.
 */
export function siblingPage(name, base = window.location.pathname) {
  const ext = /\.html$/.test(base) ? '.html' : '';
  const dir = base.replace(/[^/]*$/, '');
  return `${dir}${name}${ext}`;
}

/* ── the compact form ─────────────────────────────────────────────────────── */

const toBase64url = (bytes) => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64url = (text) => {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
};

async function through(stream, bytes) {
  const writer = stream.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const chunks = [];
  const reader = stream.readable.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

/** The spec, gzipped into a query parameter. */
export async function packSpec(spec) {
  const bytes = new TextEncoder().encode(JSON.stringify(spec));
  if (typeof CompressionStream === 'undefined') return `j${toBase64url(bytes)}`;
  try {
    return `z${toBase64url(await through(new CompressionStream('gzip'), bytes))}`;
  } catch {
    // an old Safari, or a browser that knows the class but not gzip
    return `j${toBase64url(bytes)}`;
  }
}

/** Read whichever form the link is in, including links made before markers. */
export async function unpackSpec(encoded) {
  if (!encoded) return null;
  try {
    const marker = encoded[0];
    const body = encoded.slice(1);
    if (marker === 'j') return JSON.parse(new TextDecoder().decode(fromBase64url(body)));
    if (marker === 'z') {
      const raw = await through(new DecompressionStream('gzip'), fromBase64url(body));
      return JSON.parse(new TextDecoder().decode(raw));
    }
    return decodeSpec(encoded);
  } catch {
    return null;
  }
}

/** Whether this page is a client tour at all — cheap, and needs no decoding. */
export function hasSpec() {
  try {
    return Boolean(new URLSearchParams(window.location.search).get('p'));
  } catch {
    return false;
  }
}

export function encodedFromLocation() {
  try {
    return new URLSearchParams(window.location.search).get('p') || '';
  } catch {
    return '';
  }
}

/** The link an agent copies, with the property packed into it. */
export async function tourUrlAsync(spec, base = window.location.origin + window.location.pathname) {
  const path = base.replace(/\/studio(\.html)?$/, '/tour');
  return `${path}?p=${await packSpec(spec)}`;
}
