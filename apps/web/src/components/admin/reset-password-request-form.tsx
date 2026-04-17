"use client";

import { useState, type FormEvent } from "react";
import { AdminApiError, requestAdminPasswordReset } from "../../admin/api";

const shouldShowManualAdminLinks = process.env.NODE_ENV !== "production";

export function ResetPasswordRequestForm() {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const response = await requestAdminPasswordReset({ email });
      setSuccessMessage("If the account exists and is active, password reset instructions have been created.");
      setResetUrl(shouldShowManualAdminLinks ? response.resetUrl ?? null : null);
    } catch (error) {
      setErrorMessage(error instanceof AdminApiError ? error.message : "Reset request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="ui-field">
        <span className="ui-field-label">Email</span>
        <input
          className="ui-input"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      {errorMessage ? <p className="ui-inline-error">{errorMessage}</p> : null}
      {successMessage ? <p className="ui-inline-success">{successMessage}</p> : null}
      {resetUrl ? (
        <div className="ui-message-box-success">
          <p className="font-medium">Manual-share reset link</p>
          <p className="mt-1 break-all">{resetUrl}</p>
        </div>
      ) : null}
      <button
        className="ui-button-primary flex w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Requesting..." : "Request reset"}
      </button>
    </form>
  );
}
