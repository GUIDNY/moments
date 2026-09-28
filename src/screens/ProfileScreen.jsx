import { useState } from 'react';
import { PATTERNS } from '../data/patterns';
import { avatarEmoji, ITEMS_BY_ID } from '../data/items';
import { formatCoins, levelTitle } from '../engine/economy';
import { useGame } from '../engine/GameContext';
import Button from '../ui/Button';
import GameShell from '../ui/GameShell';
import Modal from '../ui/Modal';

export default function ProfileScreen({ onExit }) {
  const { state, levelInfo, achievements, setName, hardReset, multiplier } = useGame();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.name);
  const [confirmReset, setConfirmReset] = useState(false);

  const known = PATTERNS.map((p) => ({ pattern: p, seen: state.patternSeen[p.id] })).filter(
    (row) => row.seen
  );
  const mastered = known.filter((row) => row.seen.right >= 3 && row.seen.right > row.seen.wrong);
  const perk = state.equippedPerk ? ITEMS_BY_ID[state.equippedPerk] : null;

  return (
    <GameShell title="הבית שלך" emoji="🏠" onExit={onExit}>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-xl mx-auto space-y-4">
          {/* identity */}
          <div className="rounded-2xl border border-border/60 bg-surface-container p-6 text-center">
            <div className="text-6xl mb-2">{avatarEmoji(state.avatar)}</div>
            <button
              type="button"
              className="text-2xl font-bold text-text hover:text-primary"
              onClick={() => {
                setDraft(state.name);
                setEditing(true);
              }}
            >
              {state.name} ✎
            </button>
            <div className="text-sm text-primary font-bold mt-1">
              רמה {levelInfo.level} · {levelTitle(levelInfo.level)}
            </div>

            <div className="mt-4">
              <div className="h-2.5 bg-surface-bright rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${levelInfo.pct}%` }} />
              </div>
              <div className="text-xs text-text-3 mt-1.5 tabular-nums">
                {levelInfo.into}/{levelInfo.needed} XP לרמה {levelInfo.level + 1}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div>
                <div className="text-lg font-bold text-gold tabular-nums">{formatCoins(state.coins)}</div>
                <div className="text-[11px] text-text-3">מטבעות</div>
              </div>
              <div>
                <div className="text-lg font-bold text-text tabular-nums">{state.totalPlays}</div>
                <div className="text-[11px] text-text-3">משחקונים</div>
              </div>
              <div>
                <div className="text-lg font-bold text-tertiary tabular-nums">×{multiplier}</div>
                <div className="text-[11px] text-text-3">{perk ? perk.name : 'בלי חפץ מזל'}</div>
              </div>
            </div>
          </div>

          {/* pattern mastery */}
          <div className="rounded-2xl border border-border/60 bg-surface-container p-5">
            <h3 className="font-bold text-text mb-1">התבניות שאתה מכיר</h3>
            <p className="text-xs text-text-3 mb-4">
              שלטת ב-{mastered.length} מתוך {PATTERNS.length} תבניות
            </p>
            {known.length === 0 ? (
              <p className="text-sm text-text-3">שחק במגדל הגרפים כדי להתחיל לאסוף תבניות.</p>
            ) : (
              <ul className="space-y-1.5">
                {known
                  .sort((a, b) => b.seen.right - a.seen.right)
                  .map(({ pattern, seen }) => {
                    const total = seen.right + seen.wrong;
                    const pct = Math.round((seen.right / total) * 100);
                    return (
                      <li key={pattern.id} className="flex items-center gap-3">
                        <span className="text-xs text-text-2 w-32 shrink-0 truncate">{pattern.name}</span>
                        <span className="flex-1 h-2 bg-surface-bright rounded-full overflow-hidden">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${pct}%`, background: pct >= 60 ? '#44e092' : '#ffb4aa' }}
                          />
                        </span>
                        <span className="text-[11px] text-text-3 tabular-nums w-14 text-left">
                          {seen.right}/{total}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>

          {/* achievements */}
          <div className="rounded-2xl border border-border/60 bg-surface-container p-5">
            <h3 className="font-bold text-text mb-4">
              הישגים ({achievements.filter((a) => a.unlocked).length}/{achievements.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 rounded-xl p-3 border ${
                    a.unlocked ? 'border-primary/40 bg-primary/5' : 'border-border/40 opacity-50'
                  }`}
                >
                  <span className="text-2xl">{a.unlocked ? a.emoji : '🔒'}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-text truncate">{a.name}</span>
                    <span className="block text-[11px] text-text-3">{a.desc}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pb-4">
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
              איפוס ההתקדמות
            </Button>
          </div>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)}>
        <div className="p-6">
          <h3 className="font-bold text-text mb-3">איך קוראים לך בעיר?</h3>
          <input
            value={draft}
            maxLength={16}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text mb-4 outline-none focus:border-primary"
          />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                setName(draft.trim());
                setEditing(false);
              }}
            >
              שמור
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => setEditing(false)}>
              ביטול
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <div className="p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="font-bold text-text mb-2">למחוק את כל ההתקדמות?</h3>
          <p className="text-sm text-text-2 mb-5">
            המטבעות, הרמה, הפריטים וההישגים יימחקו. אי אפשר לבטל.
          </p>
          <div className="flex gap-2">
            <Button
              variant="down"
              className="flex-1"
              onClick={() => {
                hardReset();
                setConfirmReset(false);
                onExit();
              }}
            >
              כן, אפס
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmReset(false)}>
              לא, חזור
            </Button>
          </div>
        </div>
      </Modal>
    </GameShell>
  );
}
