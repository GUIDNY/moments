import { useState } from 'react';
import { avatarEmoji, ITEMS_BY_ID } from '../data/items';
import { formatCoins, levelTitle } from '../engine/economy';
import { useGame } from '../engine/GameContext';
import { useI18n } from '../i18n/I18nContext';
import Button from '../ui/Button';
import GameShell from '../ui/GameShell';
import Modal from '../ui/Modal';

export default function ProfileScreen({ onExit }) {
  const { state, levelInfo, achievements, setName, hardReset, multiplier } = useGame();
  const { t, loc, lang, setLang, languages } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.name);
  const [confirmReset, setConfirmReset] = useState(false);

  const perk = state.equippedPerk ? ITEMS_BY_ID[state.equippedPerk] : null;

  return (
    <GameShell title={t('profile.title')} emoji="🏠" onExit={onExit}>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-xl mx-auto space-y-4">
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
              {t('common.level')} {levelInfo.level} · {loc(levelTitle(levelInfo.level))}
            </div>

            <div className="mt-4">
              <div className="h-2.5 bg-surface-bright rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${levelInfo.pct}%` }}
                />
              </div>
              <div className="text-xs text-text-3 mt-1.5 tabular-nums">
                {t('profile.xpToNext', {
                  into: levelInfo.into,
                  needed: levelInfo.needed,
                  next: levelInfo.level + 1,
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              <div>
                <div className="text-lg font-bold text-gold tabular-nums">
                  {formatCoins(state.coins)}
                </div>
                <div className="text-[11px] text-text-3">{t('profile.coins')}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-text tabular-nums">{state.totalPlays}</div>
                <div className="text-[11px] text-text-3">{t('profile.games')}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-tertiary tabular-nums">×{multiplier}</div>
                <div className="text-[11px] text-text-3">
                  {perk ? loc(perk.name) : t('profile.noCharm')}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface-container p-5">
            <h3 className="font-bold text-text mb-3">{t('profile.language')}</h3>
            <div className="flex gap-2">
              {Object.entries(languages).map(([code, info]) => (
                <Button
                  key={code}
                  size="sm"
                  variant={lang === code ? 'primary' : 'ghost'}
                  className="flex-1"
                  onClick={() => setLang(code)}
                >
                  {info.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-surface-container p-5">
            <h3 className="font-bold text-text mb-4">
              {t('profile.achievements')} ({achievements.filter((a) => a.unlocked).length}/
              {achievements.length})
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
                    <span className="block text-sm font-bold text-text truncate">
                      {loc(a.name)}
                    </span>
                    <span className="block text-[11px] text-text-3">{loc(a.desc)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pb-4">
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
              {t('profile.reset')}
            </Button>
          </div>
        </div>
      </div>

      <Modal open={editing} onClose={() => setEditing(false)}>
        <div className="p-6">
          <h3 className="font-bold text-text mb-3">{t('profile.rename')}</h3>
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
              {t('common.save')}
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => setEditing(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <div className="p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h3 className="font-bold text-text mb-2">{t('profile.resetTitle')}</h3>
          <p className="text-sm text-text-2 mb-5">{t('profile.resetBody')}</p>
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
              {t('profile.resetYes')}
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmReset(false)}>
              {t('profile.resetNo')}
            </Button>
          </div>
        </div>
      </Modal>
    </GameShell>
  );
}
