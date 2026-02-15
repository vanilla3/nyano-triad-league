import React from "react";
import type { AiReasonCode } from "@/lib/ai/nyano_ai";
import { NyanoReaction, pickReactionKind, type NyanoReactionInput } from "./NyanoReaction";

export interface NyanoReactionSlotProps {
  input: NyanoReactionInput | null;
  turnIndex: number;
  rpg?: boolean;
  mint?: boolean;
  tone?: "mint" | "pixi";
  aiReasonCode?: AiReasonCode;
  stageFocus?: boolean;
  className?: string;
  testId?: string;
}

export function NyanoReactionSlot({
  input,
  turnIndex,
  rpg = false,
  mint = false,
  tone = "mint",
  aiReasonCode,
  stageFocus = false,
  className = "",
  testId = "nyano-reaction-slot",
}: NyanoReactionSlotProps) {
  const hasVisibleReaction = input !== null && pickReactionKind(input) !== "idle";
  const slotClassName = [
    "mint-nyano-reaction-slot",
    stageFocus ? "mint-nyano-reaction-slot--stage-focus" : "",
    hasVisibleReaction ? "mint-nyano-reaction-slot--active" : "mint-nyano-reaction-slot--idle",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div
      className={slotClassName}
      data-testid={testId}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Always reserve slot area even if NyanoReaction returns null (idle). */}
      <span className="mint-nyano-reaction-slot__placeholder" aria-hidden="true" />
      <div className="mint-nyano-reaction-slot__content">
        {input ? (
          <NyanoReaction
            input={input}
            turnIndex={turnIndex}
            rpg={rpg}
            mint={mint}
            tone={tone}
            aiReasonCode={aiReasonCode}
            className={stageFocus ? "stage-focus-cutin" : ""}
          />
        ) : null}
      </div>
    </div>
  );
}
