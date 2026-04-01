import { Router, type Router as ExpressRouter } from "express";
import { getPublicBlogBySlug, getPublicBlogs } from "./blog.controller.js";

export const blogRouter: ExpressRouter = Router();

blogRouter.get("/", getPublicBlogs);
blogRouter.get("/:slug", getPublicBlogBySlug);
