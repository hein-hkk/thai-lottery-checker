import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AdminApiError, getAdminMe, getAdminResultDetail } from "../../../../../src/admin/api";
import { ResultEditorForm } from "../../../../../src/components/admin/result-editor-form";

export const dynamic = "force-dynamic";

interface AdminResultDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminResultDetailPage({ params }: AdminResultDetailPageProps) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    redirect("/admin/login");
  }

  if (!session.admin.effectivePermissions.includes("manage_results")) {
    redirect("/admin");
  }

  try {
    const response = await getAdminResultDetail(id, cookieHeader);
    return <ResultEditorForm initialResult={response.result} />;
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
