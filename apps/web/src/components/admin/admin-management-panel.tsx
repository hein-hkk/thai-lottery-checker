"use client";

import { useState, type FormEvent } from "react";
import type { AdminListItem, AdminPermission, AdminRole } from "@thai-lottery-checker/types";
import { adminPermissions } from "@thai-lottery-checker/types";
import { AdminApiError, createAdminInvitation, updateAdminAccount } from "../../admin/api";

interface AdminManagementPanelProps {
  initialAdmins: AdminListItem[];
}

type InvitationFormState = {
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
};

const defaultInvitationState: InvitationFormState = {
  email: "",
  role: "editor",
  permissions: ["manage_results"]
};

export function AdminManagementPanel({ initialAdmins }: AdminManagementPanelProps) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [inviteForm, setInviteForm] = useState<InvitationFormState>(defaultInvitationState);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatingAdminId, setUpdatingAdminId] = useState<string | null>(null);

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError(null);
    setInviteMessage(null);
    setInviteUrl(null);
    setIsInviting(true);

    try {
      const response = await createAdminInvitation(inviteForm);
      setInviteMessage(`Invitation created for ${response.email}.`);
      setInviteUrl(response.inviteUrl ?? null);
      setInviteForm(defaultInvitationState);
    } catch (error) {
      setInviteError(error instanceof AdminApiError ? error.message : "Failed to create invitation");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRoleChange(admin: AdminListItem, role: AdminRole) {
    await applyAdminUpdate(admin.id, {
      role,
      permissions: role === "editor" ? admin.permissions : []
    });
  }

  async function handlePermissionToggle(admin: AdminListItem, permission: AdminPermission) {
    const nextPermissions = admin.permissions.includes(permission)
      ? admin.permissions.filter((item) => item !== permission)
      : [...admin.permissions, permission];

    await applyAdminUpdate(admin.id, {
      permissions: nextPermissions
    });
  }

  async function handleActiveToggle(admin: AdminListItem) {
    await applyAdminUpdate(admin.id, {
      isActive: !admin.isActive
    });
  }

  async function applyAdminUpdate(adminId: string, payload: { role?: AdminRole; permissions?: AdminPermission[]; isActive?: boolean }) {
    setUpdateError(null);
    setUpdatingAdminId(adminId);

    try {
      const response = await updateAdminAccount(adminId, payload);
      setAdmins((currentAdmins) =>
        currentAdmins.map((admin) => (admin.id === adminId ? response.admin : admin))
      );
    } catch (error) {
      setUpdateError(error instanceof AdminApiError ? error.message : "Failed to update admin");
    } finally {
      setUpdatingAdminId(null);
    }
  }

  function toggleInvitePermission(permission: AdminPermission) {
    setInviteForm((current) => ({
      ...current,
      permissions:
        current.permissions.includes(permission)
          ? current.permissions.filter((item) => item !== permission)
          : [...current.permissions, permission]
    }));
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Invite admin</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Create invitation</h2>
        </div>

        <form className="space-y-4" onSubmit={handleInviteSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-600"
                onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                required
                type="email"
                value={inviteForm.email}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Role</span>
              <select
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-600"
                onChange={(event) =>
                  setInviteForm((current) => ({
                    ...current,
                    role: event.target.value as AdminRole,
                    permissions: event.target.value === "editor" ? current.permissions : []
                  }))
                }
                value={inviteForm.role}
              >
                <option value="editor">editor</option>
                <option value="super_admin">super_admin</option>
              </select>
            </label>
          </div>

          {inviteForm.role === "editor" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">Permissions</p>
              <div className="flex flex-wrap gap-3">
                {adminPermissions.map((permission) => (
                  <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm" key={permission}>
                    <input
                      checked={inviteForm.permissions.includes(permission)}
                      onChange={() => toggleInvitePermission(permission)}
                      type="checkbox"
                    />
                    <span>{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          {inviteError ? <p className="text-sm text-rose-600">{inviteError}</p> : null}
          {inviteMessage ? <p className="text-sm text-emerald-700">{inviteMessage}</p> : null}
          {inviteUrl ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <p className="font-medium">Manual-share invitation link</p>
              <p className="mt-1 break-all">{inviteUrl}</p>
            </div>
          ) : null}

          <button
            className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isInviting}
            type="submit"
          >
            {isInviting ? "Creating..." : "Create invitation"}
          </button>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Admin accounts</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Manage access</h2>
        </div>

        {updateError ? <p className="mb-4 text-sm text-rose-600">{updateError}</p> : null}

        <div className="space-y-4">
          {admins.map((admin) => {
            const isUpdating = updatingAdminId === admin.id;

            return (
              <article className="rounded-2xl border border-slate-200 p-5" key={admin.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-slate-950">{admin.name ?? admin.email}</h3>
                    <p className="text-sm text-slate-600">{admin.email}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      {admin.isActive ? "active" : "inactive"} • last login {admin.lastLoginAt ?? "never"}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="space-y-2 text-sm">
                      <span className="font-medium text-slate-700">Role</span>
                      <select
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-slate-600"
                        disabled={isUpdating}
                        onChange={(event) => void handleRoleChange(admin, event.target.value as AdminRole)}
                        value={admin.role}
                      >
                        <option value="editor">editor</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </label>

                    <div className="space-y-2 text-sm md:col-span-2">
                      <span className="font-medium text-slate-700">Permissions</span>
                      <div className="flex flex-wrap gap-3">
                        {adminPermissions.map((permission) => (
                          <label
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2"
                            key={permission}
                          >
                            <input
                              checked={admin.permissions.includes(permission)}
                              disabled={isUpdating || admin.role !== "editor"}
                              onChange={() => void handlePermissionToggle(admin, permission)}
                              type="checkbox"
                            />
                            <span>{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <p className="text-xs text-slate-500">Created {new Date(admin.createdAt).toLocaleString()}</p>
                  <button
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isUpdating}
                    onClick={() => void handleActiveToggle(admin)}
                    type="button"
                  >
                    {admin.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
