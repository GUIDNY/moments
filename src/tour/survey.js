/**
 * Ask the server to read the photographs.
 *
 * The one call in this app that is not static. It has to be: reading the
 * photographs means a model, a model means an API key, and an API key cannot
 * live in a page anyone can view source on.
 *
 * Everything downstream — the plan, the colours, the furniture, the link — is
 * built in the browser from what comes back, so this is also the only moment
 * the product depends on anything being up.
 */

const TIMEOUT_MS = 120000;

export async function surveyPhotos(photos) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch('/api/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photos }),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new SurveyError(body.error || `http-${res.status}`);
    return body;
  } catch (err) {
    if (err instanceof SurveyError) throw err;
    if (err.name === 'AbortError') throw new SurveyError('timeout');
    throw new SurveyError('network');
  } finally {
    clearTimeout(timer);
  }
}

export class SurveyError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
    this.name = 'SurveyError';
  }
}
