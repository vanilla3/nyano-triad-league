export type ReplayMode = "auto" | "v1" | "v2" | "compare";

export function parseReplayMode(v: string | null): ReplayMode {
  if (v === "auto" || v === "v1" || v === "v2" || v === "compare") return v;
  return "auto";
}

export function replayModeDisplay(mode: ReplayMode): string {
  if (mode === "auto") return "自動 (auto)";
  if (mode === "v1") return "エンジン v1 (engine v1)";
  if (mode === "v2") return "エンジン v2 (engine v2)";
  return "比較 (compare)";
}

export function parseSignedInt32Param(v: string | null): number | null {
  if (!v) return null;
  if (!/^-?\d+$/.test(v)) return null;
  const n = Number(v);
  if (!Number.isInteger(n)) return null;
  if (n < -2147483648 || n > 2147483647) return null;
  return n;
}

export function parseReplayStepParam(v: string | null): number {
  const n = Number(v ?? "0");
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(9, Math.floor(n)));
}
