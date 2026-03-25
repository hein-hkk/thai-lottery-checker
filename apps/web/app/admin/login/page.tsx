import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "../../../src/components/admin/login-form";
import { AdminAuthShell } from "../../../src/components/ui/admin-auth-shell";
import { getAdminMe } from "../../../src/admin/api";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const cookieHeader = (await cookies()).toString();
  const session = await getAdminMe(cookieHeader);

  if (session) {
    redirect("/admin");
  }

  return (
    <AdminAuthShell
      description="Sign in with your administrator account to access protected tools."
      kicker="Admin"
      title="Platform access"
    >
      <LoginForm />
    </AdminAuthShell>
  );
}
