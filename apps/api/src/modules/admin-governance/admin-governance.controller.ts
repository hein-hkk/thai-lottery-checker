import type { Request, Response } from "express";
import { createAdminGovernanceService } from "./admin-governance.service.js";
import { toAdminGovernanceErrorResponse } from "./admin-governance.errors.js";

const adminGovernanceService = createAdminGovernanceService();

export async function createInvitation(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const payload = await adminGovernanceService.createInvitation(request.currentAdmin, request.body);
    response.status(201).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminGovernanceErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function acceptInvitation(request: Request, response: Response): Promise<void> {
  try {
    const payload = await adminGovernanceService.acceptInvitation(request.body);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminGovernanceErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function revokeInvitation(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const payload = await adminGovernanceService.revokeInvitation(request.currentAdmin, request.body);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminGovernanceErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function requestPasswordReset(request: Request, response: Response): Promise<void> {
  try {
    const payload = await adminGovernanceService.requestPasswordReset(request.body);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminGovernanceErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function confirmPasswordReset(request: Request, response: Response): Promise<void> {
  try {
    const payload = await adminGovernanceService.confirmPasswordReset(request.body);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminGovernanceErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function listAdmins(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const payload = await adminGovernanceService.listAdmins(request.currentAdmin);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminGovernanceErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function updateAdmin(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const adminId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const payload = await adminGovernanceService.updateAdmin(request.currentAdmin, adminId ?? "", request.body);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminGovernanceErrorResponse(error);
    response.status(statusCode).json(body);
  }
}
