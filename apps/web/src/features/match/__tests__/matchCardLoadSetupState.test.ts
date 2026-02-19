import { describe, expect, it } from "vitest";
import { resolveMatchCardLoadSetupState } from "@/features/match/matchCardLoadSetupState";

describe("features/match/matchCardLoadSetupState", () => {
  it("closes setup and clears setup error when cards are already loaded", () => {
    const result = resolveMatchCardLoadSetupState({
      hasCards: true,
      error: "RPC request failed",
    });
    expect(result).toEqual({
      defaultOpen: false,
      error: null,
      showRpcSettingsCta: false,
    });
  });

  it("shows RPC settings CTA when unresolved cards have RPC-shaped error", () => {
    const result = resolveMatchCardLoadSetupState({
      hasCards: false,
      error: "RPC request failed",
    });
    expect(result).toEqual({
      defaultOpen: true,
      error: "RPC request failed",
      showRpcSettingsCta: true,
    });
  });

  it("does not show RPC settings CTA for non-rpc setup errors", () => {
    const result = resolveMatchCardLoadSetupState({
      hasCards: false,
      error: "missing tokenId",
    });
    expect(result).toEqual({
      defaultOpen: true,
      error: "missing tokenId",
      showRpcSettingsCta: false,
    });
  });

  it("keeps setup open without CTA when no setup error exists", () => {
    const result = resolveMatchCardLoadSetupState({
      hasCards: false,
      error: null,
    });
    expect(result).toEqual({
      defaultOpen: true,
      error: null,
      showRpcSettingsCta: false,
    });
  });
});
