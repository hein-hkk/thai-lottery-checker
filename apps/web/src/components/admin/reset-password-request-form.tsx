"use client";

import { useState, type FormEvent } from "react";
import { AdminApiError, requestAdminPasswordReset } from "../../admin/api";

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
      setResetUrl(response.resetUrl ?? null);
    } catch (error) {
      setErrorMessage(error instanceof AdminApiError ? error.message : "Reset request failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-600"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>
      {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
      {resetUrl ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">Manual-share reset link</p>
          <p className="mt-1 break-all">{resetUrl}</p>
        </div>
      ) : null}
      <button
        className="inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Requesting..." : "Request reset"}
      </button>
    </form>
  );
}
