"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { acceptAdminInvitation, AdminApiError } from "../../admin/api";

export function InvitationAcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await acceptAdminInvitation({ token, name, password });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof AdminApiError ? error.message : "Invitation acceptance failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="ui-field">
        <span className="ui-field-label">Name</span>
        <input
          className="ui-input"
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
      </label>
      <label className="ui-field">
        <span className="ui-field-label">Password</span>
        <input
          className="ui-input"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>
      {errorMessage ? <p className="ui-inline-error">{errorMessage}</p> : null}
      <button
        className="ui-button-primary flex w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Activating..." : "Activate account"}
      </button>
    </form>
  );
}
