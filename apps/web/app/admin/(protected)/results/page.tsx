import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminMe, getAdminResults } from "../../../../src/admin/api";
import { ResultsListPanel } from "../../../../src/components/admin/results-list-panel";

export const dynamic = "force-dynamic";

interface AdminResultsPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

function parseAdminPage(input: string | string[] | undefined): number {
  const value = Array.isArray(input) ? input[0] : input;
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AdminResultsPage({ searchParams }: AdminResultsPageProps) {
  const resolvedSearchParams = await searchParams;
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    redirect("/admin/login");
  }

  if (!session.admin.effectivePermissions.includes("manage_results")) {
    redirect("/admin");
  }

  const currentPage = parseAdminPage(resolvedSearchParams.page);
  const results = await getAdminResults({ cookieHeader, page: currentPage });

  return <ResultsListPanel results={results} />;
}
