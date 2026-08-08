import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "./app";

describe("health endpoint", () => {
  it("returns a running status payload", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("RetailMind API is running");
    expect(response.body.data).toMatchObject({
      status: expect.stringMatching(/^(ok|degraded)$/),
      database: expect.stringMatching(/^(connected|disconnected)$/),
    });
  });
});
