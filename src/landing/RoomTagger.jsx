import { ROOM_KINDS, roomName } from '../tour/surveyFromPhotos';

/**
 * The two things a photograph cannot tell us about itself.
 *
 * Everything visible in a room — its colours, its floor, its windows — comes
 * off the photograph in the browser. What no arithmetic recovers is *which*
 * room it is and how many metres across, so the agent supplies those: one
 * choice per photograph and one number off the listing.
 *
 * A row of chips for eleven room kinds looked friendlier and was much worse:
 * four photographs turned into twenty rows of buttons and a page you scroll
 * past rather than fill in. A native select collapses each photograph to a
 * single line and, on a phone, opens the picker the person already knows.
 */

const ICON = {
  entry: '🚪', hall: '🚪', living: '🛋️', kitchen: '🍳', dining: '🍽️',
  bedroom: '🛏️', bathroom: '🚿', wc: '🚽', balcony: '🌿', study: '📚', utility: '🧺',
};

export default function RoomTagger({ photos, tags, onTag, area, onArea, T, lang }) {
  const tagged = photos.filter((url) => tags[url]).length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15px] font-black text-ink-900">{T.tagTitle}</h3>
        <p className="text-[12px] text-paper-muted leading-snug mt-0.5">{T.tagSub}</p>
      </div>

      <ul className="space-y-2">
        {photos.map((url) => (
          <li key={url} className="flex items-center gap-2.5">
            <img
              src={url}
              alt=""
              className="w-12 h-12 shrink-0 rounded-xl object-cover border border-paper-200 bg-paper-100"
            />
            <select
              value={tags[url] || ''}
              onChange={(e) => onTag(url, e.target.value || null)}
              className={`flex-1 min-w-0 h-11 px-3 rounded-xl border text-[14px] font-bold outline-none
                appearance-none bg-no-repeat transition-colors ${
                  tags[url]
                    ? 'bg-paper border-paper-200 text-ink-900'
                    : 'bg-paper-50 border-dashed border-paper-200 text-paper-muted'
                }`}
              style={{
                // a caret that sits on the correct side in either direction
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7a90' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
                backgroundPosition: `${T.dir === 'rtl' ? 'left' : 'right'} 0.75rem center`,
              }}
            >
              <option value="">{T.unknownPhoto}</option>
              {ROOM_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {ICON[kind]} {roomName(kind, lang)}
                </option>
              ))}
            </select>
          </li>
        ))}
      </ul>

      <label className="block">
        <span className="block text-[11.5px] font-bold text-paper-muted mb-1">{T.areaLabel}</span>
        <input
          type="number"
          inputMode="numeric"
          min="18"
          max="400"
          value={area}
          onChange={(e) => onArea(e.target.value)}
          className="w-full h-11 px-3 rounded-xl bg-paper-50 border border-paper-200 text-ink-900 text-[15px]
            font-bold outline-none focus:border-brand focus:bg-paper transition-colors"
        />
        <span className="block text-[11px] text-paper-muted mt-1 leading-snug">{T.areaHint}</span>
      </label>

      <p className="text-[11px] font-bold text-paper-muted" aria-live="polite">
        {T.taggedCount.replace('{n}', tagged).replace('{total}', photos.length)}
      </p>
    </div>
  );
}
