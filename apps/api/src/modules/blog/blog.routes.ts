import { Router, type Router as ExpressRouter } from "express";
import { createPublicReadRateLimit } from "../../security/http.js";
import { getPublicBlogBySlug, getPublicBlogs } from "./blog.controller.js";

export const blogRouter: ExpressRouter = Router();
const publicReadRateLimit = createPublicReadRateLimit();

blogRouter.get("/", publicReadRateLimit, getPublicBlogs);
blogRouter.get("/:slug", publicReadRateLimit, getPublicBlogBySlug);
