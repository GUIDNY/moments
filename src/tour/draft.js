/**
 * The hand-off from the landing page to the builder.
 *
 * An agent uploads photographs on one page and fills the form on another, and
 * between the two there is a navigation. The photographs are already public
 * URLs by then, but they are long, and eight of them in a query string is a
 * link that some chat apps truncate — so they travel in localStorage instead.
 *
 * localStorage rather than sessionStorage on purpose: agents open the builder
 * in a new tab often enough that losing the upload there would be maddening,
 * and the draft is theirs, on their own device, until they replace it.
 */

const KEY = 'tour.draft';

export function saveDraft(patch) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readDraft(), ...patch, at: Date.now() }));
  } catch {
    /* private mode, a full quota — the builder simply starts empty */
  }
}

export function readDraft() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do about it */
  }
}
