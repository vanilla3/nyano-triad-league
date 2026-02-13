/**
 * nyano_dialogue.ts
 *
 * Centralized JP/EN dialogue lines for Nyano reactions and AI reasons.
 * Short, stream-friendly phrases that give Nyano personality.
 */

import type { ReactionKind } from "./expression_map";
import type { AiReasonCode } from "./ai/nyano_ai";

export type DialogueLanguage = "ja" | "en";

export type DialogueLine = {
  ja: string;
  en: string;
};

const NYANO_NEW_SUFFIX = "ぴかっ✨";
const TRAILING_NYANO_SUFFIX_PATTERNS: readonly RegExp[] = [
  /にゃ[〜~]?ん([！？?!…。．♪]*)$/u,
  /にゃっ([！？?!…。．♪]*)$/u,
  /にゃ[ー〜~]*([！？?!…。．♪]*)$/u,
];

function rewriteNyanoJaLine(line: string): string {
  if (!line || line.includes(NYANO_NEW_SUFFIX)) return line;
  for (const pattern of TRAILING_NYANO_SUFFIX_PATTERNS) {
    if (pattern.test(line)) {
      return line.replace(pattern, `${NYANO_NEW_SUFFIX}$1`);
    }
  }
  return line;
}

function rewriteDialogueSetJaSuffix(set: Partial<Record<string, DialogueLine[]>>): void {
  for (const lines of Object.values(set)) {
    if (!lines) continue;
    for (const line of lines) {
      line.ja = rewriteNyanoJaLine(line.ja);
    }
  }
}

// ── Reaction Dialogues ──────────────────────────────────────────────

export const REACTION_DIALOGUES: Record<ReactionKind, DialogueLine[]> = {
  idle: [
    { ja: "にゃ〜ん", en: "Nya~" },
    { ja: "さぁ、勝負だにゃ！", en: "Let's play!" },
    { ja: "…考え中にゃ", en: "Thinking..." },
    { ja: "次はどうするにゃ？", en: "What's next?" },
  ],
  flip_single: [
    { ja: "1枚ゲットにゃ！", en: "Got one!" },
    { ja: "奪ったにゃ！", en: "Captured!" },
    { ja: "もらったにゃ♪", en: "Mine now~" },
    { ja: "いただきにゃ！", en: "I'll take that!" },
  ],
  flip_multi: [
    { ja: "まとめて奪取にゃ！", en: "Multi-capture!" },
    { ja: "ごっそりにゃ！", en: "Swept 'em!" },
    { ja: "すごいにゃ！", en: "Amazing!" },
    { ja: "大量ゲットにゃ！", en: "Big haul!" },
  ],
  chain: [
    { ja: "連鎖にゃ！！", en: "Chain!!" },
    { ja: "チェーンきたにゃ！", en: "Chain combo!" },
    { ja: "つながったにゃ！", en: "It connects!" },
    { ja: "連鎖ボーナスにゃ！", en: "Chain bonus!" },
  ],
  fever: [
    { ja: "フィーバーにゃー！！", en: "Fever!!" },
    { ja: "止まらないにゃ！", en: "Unstoppable!" },
    { ja: "全開にゃ！！", en: "Full power!!" },
    { ja: "燃えてきたにゃ！", en: "On fire!" },
  ],
  momentum: [
    { ja: "勢いに乗ってきたにゃ！", en: "Building momentum!" },
    { ja: "モメンタムにゃ！", en: "Momentum!" },
    { ja: "この調子にゃ！", en: "Keep it up!" },
  ],
  domination: [
    { ja: "圧倒的にゃ！", en: "Dominant!" },
    { ja: "ドミネーションにゃ！", en: "Domination!" },
    { ja: "完全制圧にゃ！", en: "Total control!" },
  ],
  warning_triggered: [
    { ja: "罠にかかったにゃ…", en: "Trapped..." },
    { ja: "警戒マーク踏んだにゃ…", en: "Hit a warning..." },
    { ja: "にゃっ！？", en: "Nya?!" },
    { ja: "やられたにゃ…", en: "Got me..." },
  ],
  advantage: [
    { ja: "リードにゃ！", en: "In the lead!" },
    { ja: "いい調子にゃ♪", en: "Looking good~" },
    { ja: "優勢にゃ！", en: "Advantage!" },
    { ja: "この流れにゃ！", en: "On a roll!" },
  ],
  disadvantage: [
    { ja: "ピンチにゃ…", en: "In trouble..." },
    { ja: "巻き返すにゃ！", en: "Time to rally!" },
    { ja: "まだまだにゃ…", en: "Not over yet..." },
    { ja: "諦めないにゃ！", en: "Don't give up!" },
  ],
  draw_state: [
    { ja: "互角にゃ…", en: "Dead even..." },
    { ja: "いい勝負にゃ！", en: "Close match!" },
    { ja: "どっちが勝つにゃ？", en: "Who'll win?" },
  ],
  victory: [
    { ja: "勝ったにゃー！！", en: "I win!!" },
    { ja: "やったにゃ！", en: "Did it!" },
    { ja: "にゃんと！勝利にゃ！", en: "Victory!!" },
    { ja: "最高の気分にゃ！", en: "Feels great!" },
  ],
  defeat: [
    { ja: "負けたにゃ…", en: "I lost..." },
    { ja: "次は勝つにゃ！", en: "Next time!" },
    { ja: "くやしいにゃ…", en: "So close..." },
    { ja: "もう一回にゃ！", en: "One more!" },
  ],
  game_draw: [
    { ja: "引き分けにゃ！", en: "It's a draw!" },
    { ja: "いい勝負だったにゃ！", en: "Great match!" },
    { ja: "決着つかないにゃ…", en: "Undecided..." },
  ],
};

// ── AI Reason Dialogues ─────────────────────────────────────────────

export const REASON_DIALOGUES: Partial<Record<AiReasonCode, DialogueLine[]>> = {
  MAXIMIZE_FLIPS: [
    { ja: "たくさん奪うにゃ！", en: "Grab as many as I can!" },
    { ja: "最大奪取にゃ！", en: "Max capture!" },
  ],
  BLOCK_CORNER: [
    { ja: "ブロックにゃ！", en: "Blocked!" },
    { ja: "隅を守ったにゃ", en: "Corner secured!" },
    { ja: "取らせないにゃ！", en: "Not this time!" },
  ],
  SET_WARNING: [
    { ja: "罠を仕掛けたにゃ！", en: "Trap set!" },
    { ja: "警戒マーク配置にゃ", en: "Warning placed!" },
    { ja: "踏むなよ〜にゃ", en: "Watch your step~" },
  ],
  MINIMAX_D2: [
    { ja: "先を読んだにゃ", en: "Thinking ahead!" },
    { ja: "2手先まで見えたにゃ", en: "Two moves ahead!" },
  ],
  MINIMAX_D3: [
    { ja: "深読みしたにゃ〜", en: "Deep thinking!" },
    { ja: "3手先読みにゃ！", en: "Three steps ahead!" },
    { ja: "計算済みにゃ", en: "All calculated!" },
  ],
};

rewriteDialogueSetJaSuffix(REACTION_DIALOGUES);
rewriteDialogueSetJaSuffix(REASON_DIALOGUES);

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Pick a dialogue line for a reaction kind.
 * Uses `seed` (typically turnIndex) for deterministic pseudo-random selection.
 */
export function pickDialogue(
  kind: ReactionKind,
  seed: number,
  lang: DialogueLanguage = "ja",
): string {
  const lines = REACTION_DIALOGUES[kind];
  if (!lines || lines.length === 0) return "";
  const line = lines[Math.abs(seed) % lines.length];
  return line[lang];
}

/**
 * Pick a dialogue line for an AI reason code.
 * Returns null if no dialogue is available for the reason.
 */
export function pickReasonDialogue(
  reasonCode: AiReasonCode,
  seed: number,
  lang: DialogueLanguage = "ja",
): string | null {
  const lines = REASON_DIALOGUES[reasonCode];
  if (!lines || lines.length === 0) return null;
  const line = lines[Math.abs(seed) % lines.length];
  return line[lang];
}

/**
 * Detect the preferred language from the browser.
 * Returns "ja" if Japanese is detected, otherwise "en".
 */
export function detectLanguage(): DialogueLanguage {
  if (typeof navigator === "undefined") return "ja";
  const lang = navigator.language || "";
  return lang.startsWith("ja") ? "ja" : "en";
}
