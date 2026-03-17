import type { Request, Response } from "express";
import { createResultsService } from "./results.service.js";
import { toResultsErrorResponse } from "./results.errors.js";

const resultsService = createResultsService();

export async function getLatestResults(_request: Request, response: Response): Promise<void> {
  try {
    const payload = await resultsService.getLatestResults();
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toResultsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function getResultsHistory(request: Request, response: Response): Promise<void> {
  try {
    const payload = await resultsService.getResultsHistory(request.query);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toResultsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function getResultsByDrawDate(request: Request, response: Response): Promise<void> {
  try {
    const drawDate = Array.isArray(request.params.drawDate) ? request.params.drawDate[0] : request.params.drawDate;
    const payload = await resultsService.getResultsByDrawDate(drawDate ?? "");
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toResultsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}
