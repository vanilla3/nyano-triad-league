import { describe, it, expect } from "vitest";
import {
  generateSampleCommands,
  generateNightbotTemplate,
  formatEmptyCellsList,
} from "../stream_command_generator";

describe("generateSampleCommands", () => {
  it("returns up to maxCount commands", () => {
    const cmds = generateSampleCommands(0, [0, 1, 2, 3, 4, 5, 6, 7, 8], [0, 1, 2, 3, 4], 5);
    expect(cmds.length).toBeLessThanOrEqual(5);
    expect(cmds.length).toBeGreaterThan(0);
  });

  it("returns empty array when no empty cells", () => {
    const cmds = generateSampleCommands(0, [], [0, 1, 2], 5);
    expect(cmds).toEqual([]);
  });

  it("returns empty array when no remaining cards", () => {
    const cmds = generateSampleCommands(0, [0, 1, 2], [], 5);
    expect(cmds).toEqual([]);
  });

  it("generates valid #triad format commands for side A", () => {
    const cmds = generateSampleCommands(0, [4, 5, 6], [0, 2], 3);
    for (const cmd of cmds) {
      expect(cmd).toMatch(/^#triad A[1-5]->[ABC][1-3]$/);
    }
  });

  it("generates valid #triad format commands for side B", () => {
    const cmds = generateSampleCommands(1, [0, 8], [3, 4], 3);
    for (const cmd of cmds) {
      expect(cmd).toMatch(/^#triad B[1-5]->[ABC][1-3]$/);
    }
  });

  it("uses correct slot numbers (cardIndex + 1)", () => {
    // With only cardIndex 2 remaining, slot should be 3
    const cmds = generateSampleCommands(0, [4], [2], 1);
    expect(cmds).toEqual(["#triad A3->B2"]);
  });
});

describe("generateNightbotTemplate", () => {
  it("generates template for side A", () => {
    const tpl = generateNightbotTemplate(0);
    expect(tpl).toContain("#triad A");
    expect(tpl).toContain("A1~A5");
    expect(tpl).toContain("投票");
  });

  it("generates template for side B", () => {
    const tpl = generateNightbotTemplate(1);
    expect(tpl).toContain("#triad B");
    expect(tpl).toContain("B1~B5");
  });
});

describe("formatEmptyCellsList", () => {
  it("formats cell indices as coordinates", () => {
    expect(formatEmptyCellsList([0, 4, 8])).toBe("A1, B2, C3");
  });

  it("returns empty string for empty array", () => {
    expect(formatEmptyCellsList([])).toBe("");
  });
});
