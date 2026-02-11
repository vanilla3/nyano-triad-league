/**
 * errorMessage.test.ts — Tests for the error message extraction utility.
 */
import { describe, it, expect } from "vitest";
import { errorMessage } from "../errorMessage";

describe("errorMessage", () => {
  it("extracts message from Error instances", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
  });

  it("extracts message from TypeError", () => {
    expect(errorMessage(new TypeError("type error"))).toBe("type error");
  });

  it("returns string values directly", () => {
    expect(errorMessage("string error")).toBe("string error");
  });

  it("handles null gracefully", () => {
    expect(errorMessage(null)).toBe("Unknown error");
  });

  it("handles undefined gracefully", () => {
    expect(errorMessage(undefined)).toBe("Unknown error");
  });

  it("converts numbers to string", () => {
    expect(errorMessage(42)).toBe("42");
  });

  it("converts objects to string", () => {
    const result = errorMessage({ code: 500 });
    expect(result).toBe("[object Object]");
  });

  it("handles Error with empty message", () => {
    expect(errorMessage(new Error(""))).toBe("");
  });
});
