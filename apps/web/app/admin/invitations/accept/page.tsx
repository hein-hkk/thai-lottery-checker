import { InvitationAcceptForm } from "../../../../src/components/admin/invitation-accept-form";
import { AdminAuthShell } from "../../../../src/components/ui/admin-auth-shell";

export const dynamic = "force-dynamic";

interface InvitationAcceptPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function InvitationAcceptPage({ searchParams }: InvitationAcceptPageProps) {
  const { token } = await searchParams;

  return (
    <AdminAuthShell
      description="Set your name and password to finish the invitation flow."
      kicker="Admin invitation"
      title="Activate account"
    >
      {token ? <InvitationAcceptForm token={token} /> : <p className="ui-inline-error">Invitation token is missing.</p>}
    </AdminAuthShell>
  );
}
