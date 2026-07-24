import { Response } from "express";

interface ApiResponseData<T> {
  success: boolean;
  message: string;
  data?: T;
}

export function sendSuccess<T>(res: Response, data: T, message = "Success", statusCode = 200): void {
  const response: ApiResponseData<T> = { success: true, message, data };
  res.status(statusCode).json(response);
}

export function sendError(res: Response, statusCode: number, message: string, errors?: Record<string, string[]>): void {
  const response: ApiResponseData<null> & { errors?: Record<string, string[]> } = {
    success: false,
    message,
    errors,
  };
  res.status(statusCode).json(response);
}
