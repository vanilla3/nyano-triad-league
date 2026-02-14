import { resolveClassicOpenCardIndices, resolveClassicSwapIndices } from "@nyano/triad-engine";

import { resolveRulesetById } from "@/lib/ruleset_registry";
import type { OverlayStateV1 } from "@/lib/streamer_bus";

export type ClassicResolvedOpen = {
  mode: "all_open" | "three_open";
  playerA: number[];
  playerB: number[];
};

export type ClassicResolvedSwap = {
  aIndex: number;
  bIndex: number;
};

export type ClassicResolvedMetadata = {
  rulesetId: string;
  open: ClassicResolvedOpen | null;
  swap: ClassicResolvedSwap | null;
};

type ProtocolV1Header = NonNullable<NonNullable<OverlayStateV1["protocolV1"]>["header"]>;

export function resolveClassicMetadataFromHeader(
  header: ProtocolV1Header | null | undefined,
): ClassicResolvedMetadata | null {
  if (!header) return null;

  const ruleset = resolveRulesetById(header.rulesetId);
  if (!ruleset) return null;

  const classicHeader = {
    rulesetId: header.rulesetId,
    playerA: header.playerA,
    playerB: header.playerB,
    salt: header.salt,
  };

  const open = resolveClassicOpenCardIndices({ ruleset, header: classicHeader });
  const swap = resolveClassicSwapIndices({ ruleset, header: classicHeader });
  if (!open && !swap) return null;

  return {
    rulesetId: header.rulesetId,
    open: open
      ? {
          mode: open.mode,
          playerA: [...open.playerA],
          playerB: [...open.playerB],
        }
      : null,
    swap: swap
      ? {
          aIndex: swap.aIndex,
          bIndex: swap.bIndex,
        }
      : null,
  };
}

export function resolveClassicMetadataFromOverlayState(
  state: OverlayStateV1 | null,
): ClassicResolvedMetadata | null {
  return resolveClassicMetadataFromHeader(state?.protocolV1?.header);
}

