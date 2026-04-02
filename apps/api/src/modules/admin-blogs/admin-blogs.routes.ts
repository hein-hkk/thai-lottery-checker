import { Router, type Router as ExpressRouter } from "express";
import { requireAdminAuth } from "../admin-auth/admin-auth.middleware.js";
import {
  createAdminBlogDraft,
  getAdminBlogDetail,
  listAdminBlogs,
  publishAdminBlog,
  unpublishAdminBlog,
  updateAdminBlogMetadata,
  upsertAdminBlogTranslation
} from "./admin-blogs.controller.js";

export const adminBlogsRouter: ExpressRouter = Router();

adminBlogsRouter.get("/blogs", requireAdminAuth, listAdminBlogs);
adminBlogsRouter.get("/blogs/:id", requireAdminAuth, getAdminBlogDetail);
adminBlogsRouter.post("/blogs", requireAdminAuth, createAdminBlogDraft);
adminBlogsRouter.patch("/blogs/:id", requireAdminAuth, updateAdminBlogMetadata);
adminBlogsRouter.put("/blogs/:id/translations/:locale", requireAdminAuth, upsertAdminBlogTranslation);
adminBlogsRouter.post("/blogs/:id/publish", requireAdminAuth, publishAdminBlog);
adminBlogsRouter.post("/blogs/:id/unpublish", requireAdminAuth, unpublishAdminBlog);
