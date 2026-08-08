import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { sendError } from "../utils/response";
import { isProduction } from "../config/env";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 400,
    public errors?: string[]
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFoundHandler(_req: Request, res: Response): Response {
  return sendError(res, "Resource not found", 404);
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    return sendError(res, "Validation failed", 422, errors);
  }

  console.error("[Error]", err);

  return sendError(
    res,
    isProduction ? "Internal server error" : err.message,
    500
  );
}
