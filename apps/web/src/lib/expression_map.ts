// Maps NyanoReaction kinds to expression image names.

export type ExpressionName = "calm" | "playful" | "laugh" | "anger" | "anger2" | "sad" | "sadTears" | "happy";
export type EyeVariant = "eyeWhite" | "eyeBlack" | "eyeS";

export type ReactionKind =
  | "idle"
  | "flip_single"
  | "flip_multi"
  | "chain"
  | "fever"
  | "momentum"
  | "domination"
  | "warning_triggered"
  | "advantage"
  | "disadvantage"
  | "draw_state"
  | "victory"
  | "defeat"
  | "game_draw";

const REACTION_TO_EXPRESSION: Record<ReactionKind, ExpressionName> = {
  idle: "calm",
  flip_single: "playful",
  flip_multi: "laugh",
  chain: "laugh",
  fever: "happy",
  momentum: "playful",
  domination: "anger",
  warning_triggered: "anger2",
  advantage: "playful",
  disadvantage: "sad",
  draw_state: "calm",
  victory: "happy",
  defeat: "sadTears",
  game_draw: "calm",
};

export function reactionToExpression(kind: ReactionKind): ExpressionName {
  return REACTION_TO_EXPRESSION[kind] ?? "calm";
}

export function expressionImageUrl(variant: EyeVariant, expression: ExpressionName): string {
  if (expression === "happy") {
    return "/nyano/expressions/happy.webp";
  }
  return `/nyano/expressions/${variant}/${expression}.webp`;
}
