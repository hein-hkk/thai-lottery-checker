import type { Request, Response } from "express";
import { createAdminBlogsService } from "./admin-blogs.service.js";
import { toAdminBlogsErrorResponse } from "./admin-blogs.errors.js";

const adminBlogsService = createAdminBlogsService();

export async function listAdminBlogs(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const payload = await adminBlogsService.listBlogs(request.currentAdmin, request.query);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminBlogsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function getAdminBlogDetail(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const blogId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const payload = await adminBlogsService.getBlogDetail(request.currentAdmin, blogId ?? "");
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminBlogsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function createAdminBlogDraft(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const payload = await adminBlogsService.createDraft(request.currentAdmin, request.body);
    response.status(201).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminBlogsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function updateAdminBlogMetadata(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const blogId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const payload = await adminBlogsService.updateMetadata(request.currentAdmin, blogId ?? "", request.body);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminBlogsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function upsertAdminBlogTranslation(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const blogId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const locale = Array.isArray(request.params.locale) ? request.params.locale[0] : request.params.locale;
    const payload = await adminBlogsService.upsertTranslation(request.currentAdmin, blogId ?? "", locale ?? "", request.body);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminBlogsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function publishAdminBlog(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const blogId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const payload = await adminBlogsService.publish(request.currentAdmin, blogId ?? "");
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminBlogsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function unpublishAdminBlog(request: Request, response: Response): Promise<void> {
  try {
    if (!request.currentAdmin) {
      throw new Error("currentAdmin was not resolved");
    }

    const blogId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const payload = await adminBlogsService.unpublish(request.currentAdmin, blogId ?? "");
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toAdminBlogsErrorResponse(error);
    response.status(statusCode).json(body);
  }
}
