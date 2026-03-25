import type { ReactNode } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminMe } from "../../../src/admin/api";
import { LogoutButton } from "../../../src/components/admin/logout-button";
import { BrandLogo } from "../../../src/components/ui/brand-logo";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="ui-page">
      <header className="ui-shell-header">
        <div className="ui-container flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Link aria-label="LottoKai admin home" className="ui-brand-link" href="/admin">
              <BrandLogo alt="LottoKai" className="ui-brand-logo" priority variant="full" />
            </Link>
            <nav className="ui-shell-nav" aria-label="Admin navigation">
              <Link className="ui-nav-link" href="/admin">
                Home
              </Link>
              {session.admin.effectivePermissions.includes("manage_results") ? (
                <Link className="ui-nav-link" href="/admin/results">
                  Results
                </Link>
              ) : null}
              {session.admin.role === "super_admin" ? (
                <Link className="ui-nav-link" href="/admin/admins">
                  Admins
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--text-primary)]">{session.admin.name ?? session.admin.email}</p>
              <p className="text-xs text-[var(--text-muted)]">{session.admin.role}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="ui-container py-8 md:py-10">{children}</main>
    </div>
  );
}
