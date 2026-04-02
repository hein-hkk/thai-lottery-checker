import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminApiError, getAdminBlogDetail, getAdminMe } from "../../../../../src/admin/api";
import { BlogEditorForm } from "../../../../../src/components/admin/blog-editor-form";

export const dynamic = "force-dynamic";

interface AdminBlogDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBlogDetailPage({ params }: AdminBlogDetailPageProps) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    redirect("/admin/login");
  }

  if (!session.admin.effectivePermissions.includes("manage_blogs")) {
    redirect("/admin");
  }

  try {
    const response = await getAdminBlogDetail(id, cookieHeader);
    return <BlogEditorForm initialPost={response.post} />;
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
