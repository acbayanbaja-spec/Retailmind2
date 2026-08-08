import { Request, Response, NextFunction } from "express";
import hpp from "hpp";
import { sanitizeValue } from "../utils/sanitize";

export const httpParameterPollutionProtection = hpp();

export function sanitizeRequestInput(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeValue(req.body);
  }
  next();
}

export function secureHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.removeHeader("X-Powered-By");
  next();
}
