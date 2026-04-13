import { Router, type Router as ExpressRouter } from "express";
import { createAdminWriteRateLimit, requireAllowedAdminOrigin } from "../../security/http.js";
import { requireAdminAuth } from "../admin-auth/admin-auth.middleware.js";
import {
  completeAdminBlogBannerUpload,
  createAdminBlogDraft,
  getAdminBlogDetail,
  initAdminBlogBannerUpload,
  listAdminBlogs,
  publishAdminBlog,
  removeAdminBlogBanner,
  unpublishAdminBlog,
  updateAdminBlogMetadata,
  upsertAdminBlogTranslation
} from "./admin-blogs.controller.js";

export const adminBlogsRouter: ExpressRouter = Router();
const adminWriteRateLimit = createAdminWriteRateLimit();

adminBlogsRouter.use(requireAllowedAdminOrigin);
adminBlogsRouter.get("/blogs", requireAdminAuth, listAdminBlogs);
adminBlogsRouter.get("/blogs/:id", requireAdminAuth, getAdminBlogDetail);
adminBlogsRouter.post("/blogs", requireAdminAuth, adminWriteRateLimit, createAdminBlogDraft);
adminBlogsRouter.patch("/blogs/:id", requireAdminAuth, adminWriteRateLimit, updateAdminBlogMetadata);
adminBlogsRouter.post("/blogs/:id/banner/upload-init", requireAdminAuth, adminWriteRateLimit, initAdminBlogBannerUpload);
adminBlogsRouter.post("/blogs/:id/banner/complete", requireAdminAuth, adminWriteRateLimit, completeAdminBlogBannerUpload);
adminBlogsRouter.delete("/blogs/:id/banner", requireAdminAuth, adminWriteRateLimit, removeAdminBlogBanner);
adminBlogsRouter.put("/blogs/:id/translations/:locale", requireAdminAuth, adminWriteRateLimit, upsertAdminBlogTranslation);
adminBlogsRouter.post("/blogs/:id/publish", requireAdminAuth, adminWriteRateLimit, publishAdminBlog);
adminBlogsRouter.post("/blogs/:id/unpublish", requireAdminAuth, adminWriteRateLimit, unpublishAdminBlog);
