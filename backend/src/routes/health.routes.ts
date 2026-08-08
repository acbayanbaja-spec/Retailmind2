import { Router, Request, Response, NextFunction } from "express";
import { isProduction } from "../config/env";
import prisma from "../lib/prisma";
import { sendSuccess } from "../utils/response";

const router = Router();

router.get("/health", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let database: "connected" | "disconnected" = "connected";

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      database = "disconnected";
    }

    const payload = {
      status: database === "connected" ? "ok" : "degraded",
      database,
      timestamp: new Date().toISOString(),
    };

    if (database === "disconnected" && isProduction) {
      return sendSuccess(
        res,
        payload,
        "RetailMind API is running but database is unreachable",
        503
      );
    }

    return sendSuccess(res, payload, "RetailMind API is running");
  } catch (err) {
    next(err);
  }
});

export default router;
