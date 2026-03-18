import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminMe, getAdminResults } from "../../../../src/admin/api";
import { ResultsListPanel } from "../../../../src/components/admin/results-list-panel";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    redirect("/admin/login");
  }

  if (!session.admin.effectivePermissions.includes("manage_results")) {
    redirect("/admin");
  }

  const results = await getAdminResults(cookieHeader);

  return <ResultsListPanel items={results.items} />;
}
