import { ResetPasswordRequestForm } from "../../../../src/components/admin/reset-password-request-form";
import { AdminAuthShell } from "../../../../src/components/ui/admin-auth-shell";

export const dynamic = "force-dynamic";

export default function ResetPasswordRequestPage() {
  return (
    <AdminAuthShell
      description="Enter your admin email to request password reset instructions."
      kicker="Admin recovery"
      title="Request password reset"
    >
      <ResetPasswordRequestForm />
    </AdminAuthShell>
  );
}
