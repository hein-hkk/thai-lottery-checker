import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminList, getAdminMe } from "../../../../src/admin/api";
import { AdminManagementPanel } from "../../../../src/components/admin/admin-management-panel";

export const dynamic = "force-dynamic";

export default async function AdminsPage() {
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    redirect("/admin/login");
  }

  if (session.admin.role !== "super_admin") {
    redirect("/admin");
  }

  const admins = await getAdminList(cookieHeader);

  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Governance</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Admin management</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Invite new admins, control active access, and manage role or permission changes for the platform.
        </p>
      </div>
      <AdminManagementPanel initialAdmins={admins.items} />
    </section>
  );
}
