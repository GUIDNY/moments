/**
 * The whole property lives in the link. No backend, no accounts — an agent
 * fills the form, gets a URL, and sends it on WhatsApp. Base64url over UTF-8,
 * because the text is Hebrew and `btoa` alone chokes on it.
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
