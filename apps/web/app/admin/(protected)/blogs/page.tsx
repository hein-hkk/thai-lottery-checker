import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { AdminBlogStatusFilter } from "@thai-lottery-checker/types";
import { getAdminBlogs, getAdminMe } from "../../../../src/admin/api";
import { BlogsListPanel } from "../../../../src/components/admin/blogs-list-panel";

export const dynamic = "force-dynamic";

interface AdminBlogsPageProps {
  searchParams: Promise<{ status?: string }>;
}

function parseStatusFilter(input: string | undefined): AdminBlogStatusFilter {
  return input === "draft" || input === "published" || input === "all" ? input : "all";
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
  const blogs = await getAdminBlogs(activeStatus, cookieHeader);

  return <BlogsListPanel activeStatus={activeStatus} items={blogs.items} />;
}
