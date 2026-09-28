import { useCallback, useEffect, useRef, useState } from 'react';

/** Countdown in whole seconds. Calls `onEnd` once when it hits zero. */
export function useCountdown(seconds, { running = true, onEnd } = {}) {
  const [left, setLeft] = useState(seconds);
  const endedRef = useRef(false);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const reset = useCallback((next = seconds) => {
    endedRef.current = false;
    setLeft(next);
  }, [seconds]);

  useEffect(() => {
    if (!running) return undefined;
    if (left <= 0) {
      if (!endedRef.current) {
        endedRef.current = true;
        onEndRef.current?.();
      }
      return undefined;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, running]);

  return { left, reset, setLeft };
}

/** Window-level keyboard handler that always sees the latest callback. */
export function useKeys(handler, deps = []) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const onKey = (e) => ref.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** setTimeout that cleans itself up when the component unmounts. */
export function useTimers() {
  const timers = useRef([]);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    },
    []
  );
  const after = useCallback((ms, fn) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }, []);
  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  return { after, clearAll };
}

/** A green/red screen flash used as instant feedback. */
export function useFlash(ms = 450) {
  const [flash, setFlash] = useState('');
  const timer = useRef(null);
  useEffect(() => () => timer.current && clearTimeout(timer.current), []);
  const fire = useCallback(
    (correct) => {
      setFlash(correct ? 'bg-primary/15' : 'bg-secondary/15');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setFlash(''), ms);
    },
    [ms]
  );
  return [flash, fire];
}
