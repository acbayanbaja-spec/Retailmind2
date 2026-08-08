import { describe, expect, it } from "vitest";
import {
  addDays,
  endOfDay,
  percentChange,
  startOfDay,
  toDateKey,
} from "./date";

describe("date utilities", () => {
  it("normalizes start and end of day", () => {
    const date = new Date("2026-08-08T15:30:00");

    const start = startOfDay(date);
    const end = endOfDay(date);

    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it("adds days without mutating the original date", () => {
    const date = new Date("2026-08-08T12:00:00");
    const shifted = addDays(date, 3);

    expect(toDateKey(date)).toBe("2026-08-08");
    expect(toDateKey(shifted)).toBe("2026-08-11");
  });

  it("calculates percent change with zero-safe handling", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(50, 0)).toBe(100);
  });
});
