"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { adminPermissions } from "@thai-lottery-checker/types";
import type { AdminListItem, AdminPermission, AdminRole } from "@thai-lottery-checker/types";
import { Check, ChevronDown } from "lucide-react";
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

function RoleSelect({
  disabled = false,
  onChange,
  value
}: {
  disabled?: boolean;
  onChange: (role: AdminRole) => void;
  value: AdminRole;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const roles: AdminRole[] = ["editor", "super_admin"];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleRoleSelect(role: AdminRole) {
    onChange(role);
    setIsOpen(false);
  }

  return (
    <div className="ui-admin-role-menu" ref={wrapperRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="ui-button-secondary ui-admin-role-trigger"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span>{value}</span>
        <span aria-hidden="true" className="ui-admin-role-icon">
          <ChevronDown />
        </span>
      </button>

      {isOpen ? (
        <div aria-label="Role" className="ui-admin-role-popover" role="listbox">
          {roles.map((role) => (
            <button
              aria-selected={role === value}
              className={`ui-admin-role-option ${role === value ? "ui-admin-role-option-active" : ""}`}
              key={role}
              onClick={() => handleRoleSelect(role)}
              role="option"
              type="button"
            >
              <span>{role}</span>
              {role === value ? (
                <span aria-hidden="true" className="ui-admin-role-option-icon">
                  <Check />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AdminManagementPanel({ initialAdmins }: AdminManagementPanelProps) {
  const [admins, setAdmins] = useState(initialAdmins);
  const [filter, setFilter] = useState<"active" | "inactive" | "all">("active");
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

  async function applyAdminUpdate(
    adminId: string,
    payload: { role?: AdminRole; permissions?: AdminPermission[]; isActive?: boolean }
  ) {
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

  function toggleInvitePermission(permission: AdminPermission) {
    setInviteForm((current) => ({
      ...current,
      permissions:
        current.permissions.includes(permission)
          ? current.permissions.filter((item) => item !== permission)
          : [...current.permissions, permission]
    }));
  }

  const filteredAdmins = admins.filter((admin) => {
    if (filter === "active") {
      return admin.isActive;
    }

    if (filter === "inactive") {
      return !admin.isActive;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      <section className="ui-panel p-6">
        <div className="mb-6">
          <p className="ui-kicker">Invite admin</p>
          <h2 className="ui-section-title mt-2">Create invitation</h2>
        </div>

        <form className="space-y-4" onSubmit={handleInviteSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="ui-field">
              <span className="ui-field-label">Email</span>
              <input
                className="ui-input"
                onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                required
                type="email"
                value={inviteForm.email}
              />
            </label>

            <label className="ui-field">
              <span className="ui-field-label">Role</span>
              <RoleSelect
                value={inviteForm.role}
                onChange={(role) =>
                  setInviteForm((current) => ({
                    ...current,
                    role,
                    permissions: role === "editor" ? current.permissions : []
                  }))
                }
              />
            </label>
          </div>

          {inviteForm.role === "editor" ? (
            <div className="space-y-3">
              <p className="ui-field-label">Permissions</p>
              <div className="flex flex-wrap gap-3">
                {adminPermissions.map((permission) => (
                  <label
                    className="ui-panel-muted inline-flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)]"
                    key={permission}
                  >
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

          {inviteError ? <p className="ui-inline-error">{inviteError}</p> : null}
          {inviteMessage ? <p className="ui-inline-success">{inviteMessage}</p> : null}
          {inviteUrl ? (
            <div className="ui-message-box-success">
              <p className="font-medium">Manual-share invitation link</p>
              <p className="mt-1 break-all">{inviteUrl}</p>
            </div>
          ) : null}

          <button className="ui-button-primary" disabled={isInviting} type="submit">
            {isInviting ? "Creating..." : "Create invitation"}
          </button>
        </form>
      </section>

      <section className="ui-panel p-6">
        <div className="mb-6">
          <p className="ui-kicker">Admin accounts</p>
          <h2 className="ui-section-title mt-2">Manage access</h2>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {[
            { key: "active" as const, label: "Activated Admin" },
            { key: "inactive" as const, label: "Deactivated Admin" },
            { key: "all" as const, label: "All" }
          ].map((option) => (
            <button
              className={filter === option.key ? "ui-button-primary" : "ui-button-secondary"}
              key={option.key}
              onClick={() => setFilter(option.key)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {updateError ? <p className="mb-4 ui-inline-error">{updateError}</p> : null}

        <div className="space-y-4">
          {filteredAdmins.map((admin) => {
            const isUpdating = updatingAdminId === admin.id;

            return (
              <article className="ui-panel-muted p-5" key={admin.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{admin.name ?? admin.email}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{admin.email}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {admin.isActive ? "Active" : "Inactive"} • last login {admin.lastLoginAt ?? "never"}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="ui-field text-sm">
                      <span className="ui-field-label">Role</span>
                      <RoleSelect
                        disabled={isUpdating}
                        value={admin.role}
                        onChange={(role) => void handleRoleChange(admin, role)}
                      />
                    </label>

                    <div className="space-y-2 text-sm md:col-span-2">
                      <span className="ui-field-label">Permissions</span>
                      <div className="flex flex-wrap gap-3">
                        {adminPermissions.map((permission) => (
                          <label
                            className="ui-panel inline-flex items-center gap-2 px-3 py-2 text-[var(--text-primary)]"
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

                <div className="mt-4 flex flex-col gap-4 border-t border-[var(--border-default)] pt-4 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs text-[var(--text-muted)]">Created {new Date(admin.createdAt).toLocaleString()}</p>
                  <button
                    className="ui-button-secondary"
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
