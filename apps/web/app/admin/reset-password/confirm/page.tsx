import { ResetPasswordConfirmForm } from "../../../../src/components/admin/reset-password-confirm-form";
import { AdminAuthShell } from "../../../../src/components/ui/admin-auth-shell";

export const dynamic = "force-dynamic";

interface ResetPasswordConfirmPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordConfirmPage({ searchParams }: ResetPasswordConfirmPageProps) {
  const { token } = await searchParams;

  return (
    <AdminAuthShell
      description="Choose a new password to restore access to your admin account."
      kicker="Admin recovery"
      title="Set a new password"
    >
      {token ? <ResetPasswordConfirmForm token={token} /> : <p className="ui-inline-error">Password reset token is missing.</p>}
    </AdminAuthShell>
  );
}
