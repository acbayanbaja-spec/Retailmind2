import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  loginSchema,
  refreshTokenSchema,
} from "../validators/auth.validator";
import { listAuditLogsQuerySchema } from "../validators/audit.validator";

describe("auth validators", () => {
  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      email: "admin@retailmind.dev",
      password: "secret",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid login email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret",
    });

    expect(result.success).toBe(false);
  });

  it("enforces password complexity for change password", () => {
    const weak = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "short",
    });
    const strong = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "StrongPass1",
    });

    expect(weak.success).toBe(false);
    expect(strong.success).toBe(true);
  });

  it("requires refresh token body", () => {
    expect(refreshTokenSchema.safeParse({}).success).toBe(false);
    expect(refreshTokenSchema.safeParse({ refreshToken: "abc" }).success).toBe(
      true
    );
  });
});

describe("audit validators", () => {
  it("applies defaults and validates date filters", () => {
    const result = listAuditLogsQuerySchema.parse({
      dateFrom: "2026-08-01",
      dateTo: "2026-08-08",
    });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
    expect(result.dateFrom).toBe("2026-08-01");
  });

  it("rejects invalid date format", () => {
    const result = listAuditLogsQuerySchema.safeParse({
      dateFrom: "08/01/2026",
    });

    expect(result.success).toBe(false);
  });
});
