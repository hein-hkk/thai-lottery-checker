"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logoutAdmin } from "../../admin/api";

export function LogoutButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogout() {
    setIsSubmitting(true);

    try {
      await logoutAdmin();
      router.push("/admin/login");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      className="ui-button-secondary"
      disabled={isSubmitting}
      onClick={handleLogout}
      type="button"
    >
      {isSubmitting ? "Signing out..." : "Sign out"}
    </button>
  );
}
