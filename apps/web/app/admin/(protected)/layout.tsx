import type { ReactNode } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminMe } from "../../../src/admin/api";
import { LogoutButton } from "../../../src/components/admin/logout-button";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Thai Lottery Checker</p>
            <h1 className="text-xl font-semibold text-slate-950">Admin platform</h1>
            <nav className="flex items-center gap-3 text-sm text-slate-600">
              <Link className="rounded-full border border-slate-200 px-3 py-1.5 transition hover:border-slate-400 hover:text-slate-900" href="/admin">
                Home
              </Link>
              {session.admin.effectivePermissions.includes("manage_results") ? (
                <Link
                  className="rounded-full border border-slate-200 px-3 py-1.5 transition hover:border-slate-400 hover:text-slate-900"
                  href="/admin/results"
                >
                  Results
                </Link>
              ) : null}
              {session.admin.role === "super_admin" ? (
                <Link
                  className="rounded-full border border-slate-200 px-3 py-1.5 transition hover:border-slate-400 hover:text-slate-900"
                  href="/admin/admins"
                >
                  Admins
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">{session.admin.name ?? session.admin.email}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{session.admin.role}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
