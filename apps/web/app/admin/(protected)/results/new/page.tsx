import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminMe } from "../../../../../src/admin/api";
import { ResultEditorForm } from "../../../../../src/components/admin/result-editor-form";

export const dynamic = "force-dynamic";

export default async function NewAdminResultPage() {
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    redirect("/admin/login");
  }

  if (!session.admin.effectivePermissions.includes("manage_results")) {
    redirect("/admin");
  }

  return <ResultEditorForm />;
}
