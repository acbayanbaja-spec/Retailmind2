import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPercent,
  formatShortDate,
} from "./format";

describe("format utilities", () => {
  it("formats currency in PHP", () => {
    expect(formatCurrency(1500)).toContain("1,500");
  });

  it("formats numbers with grouping", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("formats percent change with sign", () => {
    expect(formatPercent(12.5)).toBe("+12.5%");
    expect(formatPercent(-3)).toBe("-3%");
  });

  it("formats short dates and date times", () => {
    expect(formatShortDate("2026-08-08T10:00:00.000Z")).toMatch(/Aug/);
    expect(formatDateTime("2026-08-08T10:00:00.000Z")).toMatch(/Aug/);
  });
});
