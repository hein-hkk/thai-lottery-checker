import type { Request, Response } from "express";
import { createAdminResultsService } from "./admin-results.service.js";
import { toAdminResultsErrorResponse } from "./admin-results.errors.js";

const adminResultsService = createAdminResultsService();

export async function listAdminResults(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const payload = await adminResultsService.listResults(request.currentAdmin);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminResultsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function getAdminResultDetail(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const drawId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const payload = await adminResultsService.getResultDetail(request.currentAdmin, drawId ?? "");
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminResultsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function createAdminResultDraft(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const payload = await adminResultsService.createDraft(request.currentAdmin, request.body);
    response.status(201).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminResultsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function updateAdminResultDraft(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const drawId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const payload = await adminResultsService.updateDraft(request.currentAdmin, drawId ?? "", request.body);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminResultsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function publishAdminResultDraft(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const drawId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const payload = await adminResultsService.publishDraft(request.currentAdmin, drawId ?? "");
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminResultsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function correctAdminPublishedResult(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const drawId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const payload = await adminResultsService.correctPublished(request.currentAdmin, drawId ?? "", request.body);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminResultsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}
