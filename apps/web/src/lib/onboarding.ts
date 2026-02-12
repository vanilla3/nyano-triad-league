const STORAGE_KEY = "nytl.onboarding.progress_v1";

export const ONBOARDING_STEPS = [
  "read_quick_guide",
  "start_first_match",
  "commit_first_move",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

type OnboardingStepMap = Record<OnboardingStep, boolean>;

export interface OnboardingProgressV1 {
  version: 1;
  updatedAtIso: string;
  steps: OnboardingStepMap;
}

function defaultStepMap(): OnboardingStepMap {
  return {
    read_quick_guide: false,
    start_first_match: false,
    commit_first_move: false,
  };
}

function nowIso(nowMs?: number): string {
  return new Date(nowMs ?? Date.now()).toISOString();
}

function defaultProgress(nowMs?: number): OnboardingProgressV1 {
  return {
    version: 1,
    updatedAtIso: nowIso(nowMs),
    steps: defaultStepMap(),
  };
}

function getStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> | null {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    // ignore
  }
  return null;
}

function parseProgress(raw: string | null): OnboardingProgressV1 | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const x = parsed as Partial<OnboardingProgressV1>;
    if (x.version !== 1 || typeof x.updatedAtIso !== "string") return null;
    if (typeof x.steps !== "object" || x.steps === null) return null;
    const steps = x.steps as Partial<OnboardingStepMap>;
    const normalized = defaultStepMap();
    for (const step of ONBOARDING_STEPS) {
      normalized[step] = steps[step] === true;
    }
    return {
      version: 1,
      updatedAtIso: x.updatedAtIso,
      steps: normalized,
    };
  } catch {
    return null;
  }
}

export function readOnboardingProgress(
  storage: Pick<Storage, "getItem"> | null = getStorage(),
): OnboardingProgressV1 {
  if (!storage) return defaultProgress();
  const parsed = parseProgress(storage.getItem(STORAGE_KEY));
  return parsed ?? defaultProgress();
}

function writeOnboardingProgress(
  progress: OnboardingProgressV1,
  storage: Pick<Storage, "setItem"> | null = getStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore
  }
}

export function markOnboardingStepDone(
  step: OnboardingStep,
  storage: Pick<Storage, "getItem" | "setItem"> | null = getStorage(),
  nowMs?: number,
): OnboardingProgressV1 {
  const current = readOnboardingProgress(storage);
  if (current.steps[step]) return current;
  const next: OnboardingProgressV1 = {
    version: 1,
    updatedAtIso: nowIso(nowMs),
    steps: {
      ...current.steps,
      [step]: true,
    },
  };
  writeOnboardingProgress(next, storage);
  return next;
}

export function resetOnboardingProgress(
  storage: Pick<Storage, "removeItem"> | null = getStorage(),
): void {
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function completedOnboardingStepCount(progress: OnboardingProgressV1): number {
  let done = 0;
  for (const step of ONBOARDING_STEPS) {
    if (progress.steps[step]) done += 1;
  }
  return done;
}

export function isOnboardingCompleted(progress: OnboardingProgressV1): boolean {
  return completedOnboardingStepCount(progress) === ONBOARDING_STEPS.length;
}
