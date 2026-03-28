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
        <p className="ui-kicker">Governance</p>
        <h2 className="ui-title text-[clamp(1.75rem,4vw,2.5rem)]">Admin management</h2>
        <p className="ui-copy max-w-2xl">
          Invite new admins, control active access, and manage role or permission changes for the platform.
        </p>
      </div>
      <AdminManagementPanel initialAdmins={admins.items} />
    </section>
  );
}
