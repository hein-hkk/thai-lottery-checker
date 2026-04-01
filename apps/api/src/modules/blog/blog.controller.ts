import type { Request, Response } from "express";
import { createBlogService } from "./blog.service.js";
import { toBlogErrorResponse } from "./blog.errors.js";

const blogService = createBlogService();

export async function getPublicBlogs(request: Request, response: Response): Promise<void> {
  try {
    const payload = await blogService.getPublicBlogs(request.query);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toBlogErrorResponse(error);
    response.status(statusCode).json(body);
  }
}

export async function getPublicBlogBySlug(request: Request, response: Response): Promise<void> {
  try {
    const slug = Array.isArray(request.params.slug) ? request.params.slug[0] : request.params.slug;
    const locale = request.query.locale;
    const payload = await blogService.getPublicBlogBySlug(slug ?? "", locale);
    response.status(200).json(payload);
  } catch (error) {
    const { statusCode, body } = toBlogErrorResponse(error);
    response.status(statusCode).json(body);
  }
}
