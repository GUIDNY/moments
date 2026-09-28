import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from '../engine/GameContext';
import { useI18n } from '../i18n/I18nContext';
import Button from '../ui/Button';
import GameShell from '../ui/GameShell';
import ResultScreen from '../ui/ResultScreen';

const PADS = [
  { id: 0, color: '#44e092', lit: '#9cf5c8' },
  { id: 1, color: '#f5c542', lit: '#ffe79a' },
  { id: 2, color: '#7aa2ff', lit: '#c3d5ff' },
  { id: 3, color: '#ff8fb1', lit: '#ffd0dd' },
];

/** Watch the sequence, repeat it. One slip and the run ends. */
export default function EchoGame({ onExit, meta }) {
  const { finishGame, multiplier } = useGame();
  const { t, loc } = useI18n();

  const [sequence, setSequence] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | showing | input | dead
  const [active, setActive] = useState(null);
  const [step, setStep] = useState(0);
  const [reward, setReward] = useState(null);

  const timers = useRef([]);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  /** Play the whole sequence back, then hand control over. */
  const show = useCallback((seq) => {
    clearTimers();
    setPhase('showing');
    setStep(0);
    // the longer the sequence the faster it plays, so it stays tense
    const gap = Math.max(300, 620 - seq.length * 18);
    seq.forEach((pad, i) => {
      timers.current.push(
        setTimeout(() => {
          if (!aliveRef.current) return;
          setActive(pad);
        }, i * gap)
      );
      timers.current.push(
        setTimeout(() => {
          if (!aliveRef.current) return;
          setActive(null);
          if (i === seq.length - 1) setPhase('input');
        }, i * gap + gap * 0.6)
      );
    });
  }, []);

  const grow = useCallback(
    (seq) => {
      const next = [...seq, Math.floor(Math.random() * PADS.length)];
      setSequence(next);
      timers.current.push(setTimeout(() => aliveRef.current && show(next), 500));
    },
    [show]
  );

  const start = () => {
    setSequence([]);
    setReward(null);
    grow([]);
  };

  const press = (pad) => {
    if (phase !== 'input') return;
    setActive(pad);
    timers.current.push(setTimeout(() => aliveRef.current && setActive(null), 160));

    if (sequence[step] !== pad) {
      clearTimers();
      const reached = sequence.length - 1; // the last sequence you did repeat in full
      setReward(finishGame(meta.id, { score: reached, base: 45 * reached + 30 }));
      setPhase('dead');
      return;
    }

    if (step + 1 >= sequence.length) {
      setStep(0);
      setPhase('showing');
      timers.current.push(setTimeout(() => aliveRef.current && grow(sequence), 620));
    } else {
      setStep((s) => s + 1);
    }
  };

  if (phase === 'dead' && reward) {
    const reached = sequence.length - 1;
    return (
      <GameShell title={loc(meta.name)} emoji={meta.emoji} onExit={onExit}>
        <ResultScreen
          emoji={reached >= 9 ? '🧠' : reached >= 5 ? '🎵' : '🙂'}
          title={t('common.finished')}
          lines={[{ label: t('common.best'), value: reached, color: '#44e092' }]}
          coins={reward.coins}
          xp={reward.xp}
          multiplier={multiplier}
          onReplay={start}
          onExit={onExit}
        />
      </GameShell>
    );
  }

  const label =
    phase === 'idle'
      ? t('common.tapToStart')
      : phase === 'showing'
        ? '👀'
        : `${step + 1} / ${sequence.length}`;

  return (
    <GameShell
      title={loc(meta.name)}
      emoji={meta.emoji}
      onExit={onExit}
      hud={
        <span className="text-sm font-bold text-text-2 tabular-nums mx-3">
          {t('common.level')} {Math.max(0, sequence.length)}
        </span>
      }
    >
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-2xl font-bold text-text-2 h-8 tabular-nums">{label}</div>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm aspect-square">
          {PADS.map((pad) => (
            <button
              key={pad.id}
              type="button"
              disabled={phase !== 'input'}
              onClick={() => press(pad.id)}
              className="rounded-3xl transition-all duration-100 disabled:cursor-default"
              style={{
                background: active === pad.id ? pad.lit : pad.color,
                transform: active === pad.id ? 'scale(0.96)' : 'scale(1)',
                boxShadow: active === pad.id ? `0 0 40px ${pad.lit}` : 'none',
                opacity: phase === 'input' || active === pad.id ? 1 : 0.72,
              }}
              aria-label={`pad ${pad.id + 1}`}
            />
          ))}
        </div>

        {phase === 'idle' && (
          <Button size="lg" onClick={start}>
            {t('common.tapToStart')}
          </Button>
        )}
      </div>
    </GameShell>
  );
}
