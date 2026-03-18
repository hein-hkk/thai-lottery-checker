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
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Admin session</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Authenticated platform access is active.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Phase 1 establishes the protected admin shell, current-session resolution, and backend authorization
          foundation for later result-management screens.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Current admin</p>
          <dl className="mt-5 space-y-4 text-sm text-slate-700">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt>Email</dt>
              <dd className="font-medium text-slate-900">{session.admin.email}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt>Name</dt>
              <dd className="font-medium text-slate-900">{session.admin.name ?? "Not set"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Role</dt>
              <dd className="font-medium uppercase tracking-[0.14em] text-slate-900">{session.admin.role}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-slate-50 shadow-[0_14px_40px_rgba(15,23,42,0.14)]">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Effective permissions</p>
          <ul className="mt-5 space-y-3 text-sm">
            {session.admin.effectivePermissions.map((permission) => (
              <li className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3" key={permission}>
                {permission}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
