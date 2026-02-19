import React from "react";

export type UseIdleOptions = {
  timeoutMs?: number;
  disabled?: boolean;
};

const DEFAULT_TIMEOUT_MS = 4200;

const IDLE_ACTIVITY_EVENTS = [
  "pointerdown",
  "pointermove",
  "keydown",
  "wheel",
  "touchstart",
] as const;

export function useIdle(options?: UseIdleOptions): boolean {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const disabled = options?.disabled ?? false;
  const [idle, setIdle] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (disabled) {
      setIdle(false);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const scheduleIdle = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setIdle(true), timeoutMs);
    };

    const onActivity = () => {
      setIdle(false);
      scheduleIdle();
    };

    scheduleIdle();
    for (const eventName of IDLE_ACTIVITY_EVENTS) {
      window.addEventListener(eventName, onActivity, { passive: true });
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      for (const eventName of IDLE_ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, onActivity);
      }
    };
  }, [disabled, timeoutMs]);

  return idle;
}

