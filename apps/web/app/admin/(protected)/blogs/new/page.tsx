import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminMe } from "../../../../../src/admin/api";
import { BlogEditorForm } from "../../../../../src/components/admin/blog-editor-form";

export const dynamic = "force-dynamic";

export default async function NewAdminBlogPage() {
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    redirect("/admin/login");
  }

  if (!session.admin.effectivePermissions.includes("manage_blogs")) {
    redirect("/admin");
  }

  return <BlogEditorForm />;
}
