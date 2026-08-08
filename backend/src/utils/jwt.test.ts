import { describe, expect, it } from "vitest";
import { signAccessToken, verifyAccessToken } from "./jwt";

describe("jwt utilities", () => {
  it("signs and verifies access tokens", () => {
    const payload = {
      userId: "11111111-1111-1111-1111-111111111111",
      email: "admin@retailmind.dev",
      roleId: "22222222-2222-2222-2222-222222222222",
      roleName: "ADMINISTRATOR",
    };

    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.roleName).toBe(payload.roleName);
  });
});
