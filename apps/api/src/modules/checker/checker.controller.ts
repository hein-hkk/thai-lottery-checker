import type { Request, Response } from "express";
import { createCheckerService } from "./checker.service.js";
import { toCheckerErrorResponse } from "./checker.errors.js";

const checkerService = createCheckerService();

export async function getCheckerDrawOptions(_request: Request, response: Response): Promise<void> {
  try {
    const payload = await checkerService.getCheckerDrawOptions();
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toCheckerErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function checkTicket(request: Request, response: Response): Promise<void> {
  try {
    const payload = await checkerService.checkTicket(request.body);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toCheckerErrorResponse(error);
    response.status(statusCode).json(body);
  }
}
