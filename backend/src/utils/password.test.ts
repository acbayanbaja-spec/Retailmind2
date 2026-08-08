import { describe, expect, it } from "vitest";
import { comparePassword, hashPassword } from "./password";

describe("password utilities", () => {
  it("hashes and verifies passwords", async () => {
    const hash = await hashPassword("DevPassword123!");

    expect(hash).not.toBe("DevPassword123!");
    await expect(comparePassword("DevPassword123!", hash)).resolves.toBe(true);
    await expect(comparePassword("wrong-password", hash)).resolves.toBe(false);
  }, 15000);
});
