import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminBlogStatusFilter } from "@thai-lottery-checker/types";
import { getAdminBlogs, getAdminMe } from "../../../../src/admin/api";
import { BlogsListPanel } from "../../../../src/components/admin/blogs-list-panel";

export const dynamic = "force-dynamic";

interface AdminBlogsPageProps {
  searchParams: Promise<{ status?: string; page?: string | string[] }>;
}

function parseStatusFilter(input: string | undefined): AdminBlogStatusFilter {
  return input === "draft" || input === "published" || input === "all" ? input : "all";
}

function parseAdminPage(input: string | string[] | undefined): number {
  const value = Array.isArray(input) ? input[0] : input;
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminBlogsPage({ searchParams }: AdminBlogsPageProps) {
  const resolvedSearchParams = await searchParams;
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    redirect("/admin/login");
  }

  if (!session.admin.effectivePermissions.includes("manage_blogs")) {
    redirect("/admin");
  }

  const activeStatus = parseStatusFilter(resolvedSearchParams.status);
  const currentPage = parseAdminPage(resolvedSearchParams.page);
  const blogs = await getAdminBlogs(activeStatus, { cookieHeader, page: currentPage });

  return <BlogsListPanel activeStatus={activeStatus} blogs={blogs} />;
}
