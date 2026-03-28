"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AdminApiError, loginAdmin } from "../../admin/api";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await loginAdmin({ email, password });
      router.push("/admin");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof AdminApiError ? error.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="ui-field">
        <span className="ui-field-label">Email</span>
        <input
          autoComplete="email"
          className="ui-input"
          disabled={isSubmitting}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>

      <label className="ui-field">
        <span className="ui-field-label">Password</span>
        <input
          autoComplete="current-password"
          className="ui-input"
          disabled={isSubmitting}
          name="password"
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
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
