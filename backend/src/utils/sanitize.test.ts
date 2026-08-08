import { describe, expect, it } from "vitest";
import { sanitizeValue } from "./sanitize";

describe("sanitizeValue", () => {
  it("removes prototype pollution keys from objects", () => {
    const input = {
      name: "RetailMind",
      __proto__: { polluted: true },
      constructor: { prototype: { polluted: true } },
    };

    const result = sanitizeValue(input) as Record<string, unknown>;

    expect(result.name).toBe("RetailMind");
    expect(Object.hasOwn(result, "__proto__")).toBe(false);
    expect(Object.hasOwn(result, "constructor")).toBe(false);
  });

  it("sanitizes nested objects and arrays", () => {
    const input = {
      items: [{ ok: true, prototype: "drop" }],
    };

    const result = sanitizeValue(input) as {
      items: Record<string, unknown>[];
    };

    expect(result.items[0].ok).toBe(true);
    expect(result.items[0].prototype).toBeUndefined();
  });
});
