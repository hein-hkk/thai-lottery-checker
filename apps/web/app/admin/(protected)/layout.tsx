import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminMe } from "../../../src/admin/api";
import { LogoutButton } from "../../../src/components/admin/logout-button";
import { AdminHeader } from "../../../src/components/ui/admin-header";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="ui-page">
      <AdminHeader
        actions={<LogoutButton />}
        logoHref="/admin"
        navItems={[
          { href: "/admin", label: "Home" },
          ...(session.admin.effectivePermissions.includes("manage_blogs") ? [{ href: "/admin/blogs", label: "Blogs" }] : []),
          ...(session.admin.effectivePermissions.includes("manage_results") ? [{ href: "/admin/results", label: "Results" }] : []),
          ...(session.admin.role === "super_admin" ? [{ href: "/admin/admins", label: "Admins" }] : [])
        ]}
        userMeta={
          <div className="text-right">
            <p className="text-sm font-medium text-[var(--text-primary)]">{session.admin.name ?? session.admin.email}</p>
            <p className="text-xs text-[var(--text-muted)]">{session.admin.role}</p>
          </div>
        }
      />
      <main className="ui-container py-8 md:py-10">{children}</main>
    </div>
  );
}
