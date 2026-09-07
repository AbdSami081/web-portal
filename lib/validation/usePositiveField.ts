import { useRef } from "react";
import { toast } from "sonner";

let lastNotifyAt = 0;

function notifyNonPositive(label: string) {
  const now = Date.now();
  if (now - lastNotifyAt < 1500) return;
  lastNotifyAt = now;
  toast.info(`${label} must be greater than zero.`);
}

export function isPositiveNumber(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

export interface PositiveFieldGuard {
  track: (value: unknown) => void;
  resolve: (raw: string) => { ok: boolean; value: number };
}

export function usePositiveField(
  label: string,
  seed: unknown,
  defaultValue = 1
): PositiveFieldGuard {
  const seedNum = Number(seed);
  const lastValid = useRef<number>(
    Number.isFinite(seedNum) && seedNum > 0 ? seedNum : defaultValue
  );

  const track = (value: unknown) => {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) lastValid.current = n;
  };

  const resolve = (raw: string) => {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      lastValid.current = n;
      return { ok: true, value: n };
    }
    notifyNonPositive(label);
    return { ok: false, value: lastValid.current };
  };

  return { track, resolve };
}
