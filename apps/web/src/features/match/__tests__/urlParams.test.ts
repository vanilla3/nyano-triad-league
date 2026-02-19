import { describe, expect, it } from "vitest";
import {
  parseMatchSearchParams,
  parseAiDifficulty,
  parseBool01,
  parseFirstPlayer,
  parseFocusMode,
  parseMatchBoardUi,
  parseOpponentMode,
  parseSeason,
  resolveClassicMaskParamPatch,
  withMatchParamCompatibility,
} from "@/features/match/urlParams";

describe("features/match/urlParams", () => {
  it("parses opponent mode aliases", () => {
    expect(parseOpponentMode(null)).toBe("pvp");
    expect(parseOpponentMode("ai")).toBe("vs_nyano_ai");
    expect(parseOpponentMode("nyano")).toBe("vs_nyano_ai");
    expect(parseOpponentMode("vs_nyano_ai")).toBe("vs_nyano_ai");
    expect(parseOpponentMode("other")).toBe("pvp");
  });

  it("parses ai difficulty safely", () => {
    expect(parseAiDifficulty("easy")).toBe("easy");
    expect(parseAiDifficulty("hard")).toBe("hard");
    expect(parseAiDifficulty("expert")).toBe("expert");
    expect(parseAiDifficulty("normal")).toBe("normal");
    expect(parseAiDifficulty(null)).toBe("normal");
  });

  it("parses primitive URL flags", () => {
    expect(parseFirstPlayer("1")).toBe(1);
    expect(parseFirstPlayer("0")).toBe(0);
    expect(parseFirstPlayer(null)).toBe(0);

    expect(parseSeason("4")).toBe(4);
    expect(parseSeason("-1")).toBe(1);
    expect(parseSeason("abc")).toBe(1);

    expect(parseBool01("1", false)).toBe(true);
    expect(parseBool01("0", true)).toBe(false);
    expect(parseBool01(null, true)).toBe(true);
  });

  it("parses focus and board ui params", () => {
    expect(parseFocusMode("1")).toBe(true);
    expect(parseFocusMode("focus")).toBe(true);
    expect(parseFocusMode("FOCUS")).toBe(true);
    expect(parseFocusMode("0")).toBe(false);
    expect(parseFocusMode(null)).toBe(false);

    expect(parseMatchBoardUi("engine")).toBe("engine");
    expect(parseMatchBoardUi("rpg")).toBe("rpg");
    expect(parseMatchBoardUi("mint")).toBe("mint");
    expect(parseMatchBoardUi(null)).toBe("mint");
  });

  it("parses match-wide search params with compatibility defaults", () => {
    const params = new URLSearchParams(
      "ui=engine&focus=1&mode=guest&dm=verified&opp=ai&ai=hard&ctrl=b&rk=classic_custom&cr=3&season=4&fpm=mutual_choice&fp=1&fpa=1&fpb=0&fps=salt",
    );
    const parsed = parseMatchSearchParams(params);

    expect(parsed.ui).toBe("engine");
    expect(parsed.isFocusMode).toBe(true);
    expect(parsed.isGuestMode).toBe(true);
    expect(parsed.dataModeParam).toBe("verified");
    expect(parsed.opponentModeParam).toBe("vs_nyano_ai");
    expect(parsed.aiDifficultyParam).toBe("hard");
    expect(parsed.streamControlledSide).toBe(1);
    expect(parsed.rulesetKeyParam).toBe("classic_custom");
    expect(parsed.classicMaskParam).toBe("3");
    expect(parsed.seasonIdParam).toBe(4);
    expect(parsed.firstPlayerModeParam).toBe("mutual");
    expect(parsed.manualFirstPlayerParam).toBe(1);
    expect(parsed.mutualChoiceAParam).toBe(1);
    expect(parsed.mutualChoiceBParam).toBe(0);
    expect(parsed.commitRevealSaltParam).toBe("salt");
  });

  it("applies rk/cr compatibility mutation for single param updates", () => {
    const base = new URLSearchParams("ui=mint&rk=v2");
    const toClassicCustom = withMatchParamCompatibility(base, "rk", "classic_custom");
    expect(toClassicCustom.get("rk")).toBe("classic_custom");
    expect(toClassicCustom.get("cr")).toBe("0");

    const withMask = new URLSearchParams("rk=classic_custom&cr=7");
    const toV2 = withMatchParamCompatibility(withMask, "rk", "v2");
    expect(toV2.get("rk")).toBe("v2");
    expect(toV2.get("cr")).toBeNull();
  });

  it("resolves classic mask patch only when needed", () => {
    expect(
      resolveClassicMaskParamPatch({
        isEvent: true,
        rulesetKeyParam: "classic_custom",
        classicMaskParam: null,
        classicCustomMaskParam: "3",
      }),
    ).toBeNull();

    expect(
      resolveClassicMaskParamPatch({
        isEvent: false,
        rulesetKeyParam: "classic_custom",
        classicMaskParam: "1",
        classicCustomMaskParam: "3",
      }),
    ).toEqual({ cr: "3" });

    expect(
      resolveClassicMaskParamPatch({
        isEvent: false,
        rulesetKeyParam: "v2",
        classicMaskParam: "5",
        classicCustomMaskParam: "5",
      }),
    ).toEqual({ cr: undefined });

    expect(
      resolveClassicMaskParamPatch({
        isEvent: false,
        rulesetKeyParam: "v2",
        classicMaskParam: null,
        classicCustomMaskParam: "5",
      }),
    ).toBeNull();
  });
});
