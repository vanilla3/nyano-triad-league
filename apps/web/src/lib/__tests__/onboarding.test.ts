import { beforeEach, describe, expect, it } from "vitest";
import {
  completedOnboardingStepCount,
  isOnboardingCompleted,
  markOnboardingStepDone,
  readOnboardingProgress,
  resetOnboardingProgress,
} from "../onboarding";

const store = new Map<string, string>();
const mockStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
};

describe("onboarding", () => {
  beforeEach(() => {
    store.clear();
  });

  it("returns default progress when storage is empty", () => {
    const p = readOnboardingProgress(mockStorage);
    expect(p.version).toBe(1);
    expect(p.steps.read_quick_guide).toBe(false);
    expect(p.steps.start_first_match).toBe(false);
    expect(p.steps.commit_first_move).toBe(false);
    expect(completedOnboardingStepCount(p)).toBe(0);
    expect(isOnboardingCompleted(p)).toBe(false);
  });

  it("marks step done and persists", () => {
    const p1 = markOnboardingStepDone("read_quick_guide", mockStorage, 1_700_000_000_000);
    expect(p1.steps.read_quick_guide).toBe(true);
    expect(p1.updatedAtIso).toBe("2023-11-14T22:13:20.000Z");

    const p2 = readOnboardingProgress(mockStorage);
    expect(p2.steps.read_quick_guide).toBe(true);
    expect(p2.steps.start_first_match).toBe(false);
  });

  it("counts completion and recognizes fully completed state", () => {
    markOnboardingStepDone("read_quick_guide", mockStorage);
    markOnboardingStepDone("start_first_match", mockStorage);
    const mid = readOnboardingProgress(mockStorage);
    expect(completedOnboardingStepCount(mid)).toBe(2);
    expect(isOnboardingCompleted(mid)).toBe(false);

    markOnboardingStepDone("commit_first_move", mockStorage);
    const done = readOnboardingProgress(mockStorage);
    expect(completedOnboardingStepCount(done)).toBe(3);
    expect(isOnboardingCompleted(done)).toBe(true);
  });

  it("ignores malformed stored payload and falls back to default", () => {
    mockStorage.setItem("nytl.onboarding.progress_v1", "{\"broken\":true}");
    const p = readOnboardingProgress(mockStorage);
    expect(completedOnboardingStepCount(p)).toBe(0);
    expect(isOnboardingCompleted(p)).toBe(false);
  });

  it("resets progress", () => {
    markOnboardingStepDone("read_quick_guide", mockStorage);
    expect(completedOnboardingStepCount(readOnboardingProgress(mockStorage))).toBe(1);
    resetOnboardingProgress(mockStorage);
    expect(completedOnboardingStepCount(readOnboardingProgress(mockStorage))).toBe(0);
  });
});
