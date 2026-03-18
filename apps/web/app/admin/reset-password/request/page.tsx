import { ResetPasswordRequestForm } from "../../../../src/components/admin/reset-password-request-form";

export const dynamic = "force-dynamic";

export default function ResetPasswordRequestPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.9),_rgba(248,250,252,1)_50%)] px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-md rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Admin recovery</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Request password reset</h1>
          <p className="text-sm text-slate-600">Enter your admin email to create a reset link.</p>
        </div>
        <ResetPasswordRequestForm />
      </div>
    </main>
  );
}
