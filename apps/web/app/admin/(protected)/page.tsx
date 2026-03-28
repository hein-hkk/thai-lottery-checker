import { cookies } from "next/headers";
import { getAdminMe } from "../../../src/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (!session) {
    return null;
  }

  return (
    <section className="space-y-8">
      <div className="ui-panel p-8">
        <p className="ui-kicker">Admin session</p>
        <h2 className="ui-title mt-3 text-[clamp(1.75rem,4vw,2.5rem)]">Authenticated platform access is active.</h2>
        <p className="ui-copy mt-3 max-w-2xl">
          Phase 1 establishes the protected admin shell, current-session resolution, and backend authorization
          foundation for later result-management screens.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <article className="ui-panel p-6">
          <p className="ui-kicker">Current admin</p>
          <dl className="mt-5 space-y-4 text-sm text-[var(--text-secondary)]">
            <div className="flex justify-between gap-4 border-b border-[var(--border-default)] pb-3">
              <dt>Email</dt>
              <dd className="font-medium text-[var(--text-primary)]">{session.admin.email}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-[var(--border-default)] pb-3">
              <dt>Name</dt>
              <dd className="font-medium text-[var(--text-primary)]">{session.admin.name ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Role</dt>
              <dd className="font-medium text-[var(--text-primary)]">{session.admin.role}</dd>
            </div>
          </dl>
        </article>

        <article className="ui-panel-muted p-6">
          <p className="ui-kicker">Effective permissions</p>
          <ul className="mt-5 space-y-3 text-sm">
            {session.admin.effectivePermissions.map((permission) => (
              <li className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-3 text-[var(--text-primary)]" key={permission}>
                {permission}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
