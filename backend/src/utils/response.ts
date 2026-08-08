import { Response } from "express";
import { ApiResponse } from "../types";

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response {
  const body: ApiResponse<T> = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;
  return res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }
): Response {
  return res.status(200).json({
    success: true,
    data,
    pagination,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: string[]
): Response {
  const body: ApiResponse = { success: false, message };
  if (errors?.length) body.errors = errors;
  return res.status(statusCode).json(body);
}
