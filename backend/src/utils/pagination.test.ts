import { describe, expect, it } from "vitest";
import { buildPaginationMeta, parsePagination } from "./pagination";

describe("pagination utilities", () => {
  it("parses page and limit with defaults and bounds", () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(parsePagination({ page: "2", limit: "10" })).toEqual({
      page: 2,
      limit: 10,
      skip: 10,
    });
    expect(parsePagination({ page: "0", limit: "500" })).toEqual({
      page: 1,
      limit: 100,
      skip: 0,
    });
  });

  it("builds pagination metadata", () => {
    expect(buildPaginationMeta(2, 10, 25)).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
    expect(buildPaginationMeta(1, 20, 0).totalPages).toBe(1);
  });
});
