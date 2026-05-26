"use client";

import { useEffect, useState, useCallback } from "react";
import api from "../../../lib/api";
import Loader from "../../../components/ui/Loader";

// ── Types ─────────────────────────────────────────────────────

type PermissionMatrix = {
  [resource: string]: {
    add: boolean;
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
};

type Role = {
  _id: string;
  name: string;
  label: string;
  description: string;
  permissions: PermissionMatrix;
  isSystem: boolean;
  userCount: number;
};

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

type Pagination = {
  total: number;
  page: number;
  pages: number;
};

type APIResponse = {
  success: boolean;
  data: {
    resources: string[];
    operations: string[];
    defaults: { [key: string]: PermissionMatrix };
  };
};

const ROLE_COLORS: Record<string, string> = {
  user: "bg-blue-100 text-blue-700",
  restaurant: "bg-orange-100 text-orange-700",
  admin: "bg-purple-100 text-purple-700",
  super_admin: "bg-red-100 text-red-700",
};

const roleColor = (role: string) =>
  ROLE_COLORS[role] ?? "bg-zinc-100 text-zinc-700";

// ── Empty form state ──────────────────────────────────────────

const emptyForm = {
  name: "",
  label: "",
  description: "",
  permissions: {} as PermissionMatrix,
};

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [tab, setTab] = useState<"roles" | "users">("roles");

  // ── Roles state ───────────────────────────────────────────
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState("");

  // ── Resources & Operations from backend ────────────────────
  const [resources, setResources] = useState<string[]>([]);
  const [operations, setOperations] = useState<string[]>([]);

  // ── Role modal state ──────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Users state ───────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  // ── Fetch resources & operations ───────────────────────────
  const fetchPermissionsList = useCallback(async () => {
    try {
      const res = await api.get("/admin/roles/resources");
      const data = res.data.data as APIResponse["data"];
      setResources(data.resources || []);
      setOperations(data.operations || []);
    } catch (err) {
      console.error("Failed to fetch permission resources:", err);
    }
  }, []);

  // ── Fetch roles ───────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      setRolesError("");
      const res = await api.get("/admin/roles");
      setRoles(res.data.data);
    } catch (err: any) {
      setRolesError(err.response?.data?.message || "Failed to load roles");
    } finally {
      setRolesLoading(false);
    }
  }, []);

  // ── Fetch users ───────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError("");
      const res = await api.get("/admin/users", {
        params: { search, role: roleFilter, page, limit: 15 },
      });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err: any) {
      setUsersError(err.response?.data?.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [search, roleFilter, page]);

  useEffect(() => {
    fetchPermissionsList();
    fetchRoles();
  }, [fetchPermissionsList, fetchRoles]);

  useEffect(() => {
    if (tab === "users") fetchUsers();
  }, [tab, fetchUsers]);

  // ── Role modal helpers ────────────────────────────────────
  const openCreate = () => {
    setEditingRole(null);
    // Initialize empty permissions for all resources
    const emptyPerms: PermissionMatrix = {};
    resources.forEach((r) => {
      emptyPerms[r] = { add: false, view: false, edit: false, delete: false };
    });
    setForm({
      name: "",
      label: "",
      description: "",
      permissions: emptyPerms,
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setForm({
      name: role.name,
      label: role.label,
      description: role.description,
      permissions: { ...role.permissions },
    });
    setFormError("");
    setModalOpen(true);
  };

const togglePermissionOperation = (resource: string, operation: string) => {
  setForm((f) => ({
    ...f,
    permissions: {
      ...f.permissions,
      [resource]: {
        ...(f.permissions[resource] || { add: false, view: false, edit: false, delete: false }),
        [operation]: !f.permissions[resource]?.[operation as keyof typeof f.permissions[string]],
      },
    },
  }));
};

const toggleResourceAll = (resource: string) => {
  setForm((f) => {
    const current = f.permissions[resource] || { add: false, view: false, edit: false, delete: false };
    const allTrue = operations.every((op) => current[op as keyof typeof current]);
    const newValue = !allTrue;
    return {
      ...f,
      permissions: {
        ...f.permissions,
        [resource]: Object.fromEntries(operations.map((op) => [op, newValue])) as any,
      },
    };
  });
};

  const saveRole = async () => {
    if (!form.name.trim()) {
      setFormError("Role name is required");
      return;
    }
    try {
      setSaving(true);
      setFormError("");
      if (editingRole) {
        await api.put(`/admin/roles/${editingRole._id}`, {
          label: form.label,
          description: form.description,
          permissions: form.permissions,
        });
      } else {
        await api.post("/admin/roles", {
          name: form.name.toLowerCase().replace(/\s+/g, "_"),
          label: form.label,
          description: form.description,
          permissions: form.permissions,
        });
      }
      setModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role: Role) => {
    if (!confirm(`Delete role "${role.label}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/roles/${role._id}`);
      fetchRoles();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete role");
    }
  };

  // ── Assign role ───────────────────────────────────────────
  const assignRole = async (userId: string, newRole: string) => {
    try {
      setAssigningId(userId);
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to assign role");
    } finally {
      setAssigningId(null);
    }
  };

  // Helper: count total permissions granted for a role
  const countPermissions = (perms: PermissionMatrix): number => {
    return Object.values(perms).reduce((sum, res) => {
      return sum + Object.values(res).filter((v) => v).length;
    }, 0);
  };

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage roles with matrix-based CRUD permissions
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 w-fit shadow-sm">
        {(["roles", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-5 py-2 text-sm font-medium capitalize transition ${
              tab === t
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── TAB: ROLES ─────────────────────────────────────── */}
      {tab === "roles" && (
        <div className="space-y-4">

          <div className="flex justify-end">
            <button
              onClick={openCreate}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition"
            >
              + New Role
            </button>
          </div>

          {rolesLoading && <Loader />}

          {rolesError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {rolesError}
            </div>
          )}

          {!rolesLoading && !rolesError && (
            <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="p-3 text-left">Role</th>
                    <th className="p-3 text-left">Permissions</th>
                    <th className="p-3 text-left">Users</th>
                    <th className="p-3 text-left">Type</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role._id} className="border-t hover:bg-zinc-50">

                      <td className="p-3">
                        <div className="font-medium text-zinc-900">{role.label || role.name}</div>
                        <div className="text-xs text-zinc-400">{role.name}</div>
                        {role.description && (
                          <div className="text-xs text-zinc-400 mt-0.5">{role.description}</div>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="text-zinc-700 font-medium">{countPermissions(role.permissions)}</span>
                        <span className="text-zinc-400 text-xs ml-1">operations</span>
                      </td>

                      <td className="p-3 text-zinc-700">{role.userCount}</td>

                      <td className="p-3">
                        {role.isSystem ? (
                          <span className="rounded px-2 py-0.5 text-xs font-medium bg-zinc-100 text-zinc-500">
                            System
                          </span>
                        ) : (
                          <span className="rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                            Custom
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(role)}
                            className="rounded px-3 py-1 text-xs font-medium border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition"
                          >
                            Edit
                          </button>
                          {!role.isSystem && (
                            <button
                              onClick={() => deleteRole(role)}
                              className="rounded px-3 py-1 text-xs font-medium border border-red-200 hover:bg-red-50 text-red-600 transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>

              {roles.length === 0 && (
                <div className="p-8 text-center text-zinc-400">No roles found</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: USERS ─────────────────────────────────────── */}
      {tab === "users" && (
        <div className="space-y-4">

          {/* FILTERS */}
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 w-64"
            />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-400"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r._id} value={r.name}>{r.label || r.name}</option>
              ))}
            </select>
            <button
              onClick={fetchUsers}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition"
            >
              Search
            </button>
          </div>

          {usersLoading && <Loader />}

          {usersError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {usersError}
            </div>
          )}

          {!usersLoading && !usersError && (
            <>
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-zinc-500">
                    <tr>
                      <th className="p-3 text-left">User</th>
                      <th className="p-3 text-left">Email</th>
                      <th className="p-3 text-left">Current Role</th>
                      <th className="p-3 text-left">Joined</th>
                      <th className="p-3 text-left">Assign Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-t hover:bg-zinc-50">

                        <td className="p-3 font-medium text-zinc-900">{user.name}</td>

                        <td className="p-3 text-zinc-500">{user.email}</td>

                        <td className="p-3">
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${roleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </td>

                        <td className="p-3 text-zinc-400 text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        <td className="p-3">
                          <select
                            value={user.role}
                            disabled={assigningId === user._id}
                            onChange={(e) => assignRole(user._id, e.target.value)}
                            className="rounded-lg border border-zinc-300 px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-400 disabled:opacity-50"
                          >
                            {roles.map((r) => (
                              <option key={r._id} value={r.name}>
                                {r.label || r.name}
                              </option>
                            ))}
                          </select>
                          {assigningId === user._id && (
                            <span className="ml-2 text-xs text-zinc-400">saving…</span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>

                {users.length === 0 && (
                  <div className="p-8 text-center text-zinc-400">No users found</div>
                )}
              </div>

              {/* PAGINATION */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between text-sm text-zinc-500">
                  <span>{pagination.total} users</span>
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="rounded-lg border px-3 py-1.5 hover:bg-zinc-100 disabled:opacity-40 transition"
                    >
                      ← Prev
                    </button>
                    <span className="flex items-center px-2">
                      {page} / {pagination.pages}
                    </span>
                    <button
                      disabled={page === pagination.pages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border px-3 py-1.5 hover:bg-zinc-100 disabled:opacity-40 transition"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── ROLE MODAL WITH PERMISSION MATRIX ─────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
              <h2 className="text-lg font-semibold text-zinc-900">
                {editingRole ? `Edit "${editingRole.label || editingRole.name}"` : "Create New Role"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Name — disabled when editing */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">
                  Role Name (slug) {editingRole && <span className="text-zinc-400">— cannot be changed</span>}
                </label>
                <input
                  type="text"
                  value={form.name}
                  disabled={!!editingRole}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
                  placeholder="e.g. support_agent"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-zinc-50 disabled:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Display Label</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Support Agent"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What is this role for?"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* PERMISSION MATRIX */}
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-3">Permissions Matrix</label>
                
                <div className="overflow-x-auto border border-zinc-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        <th className="px-4 py-3 text-left font-medium text-zinc-700">Resource</th>
                        {operations.map((op) => (
                          <th key={op} className="px-4 py-3 text-center font-medium text-zinc-700 capitalize">
                            {op}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((resource) => {
                        const resourcePerms = form.permissions[resource] || {
                          add: false,
                          view: false,
                          edit: false,
                          delete: false,
                        };
                        const anyChecked = Object.values(resourcePerms).some((v) => v);

                        return (
                          <tr key={resource} className="border-b border-zinc-200 hover:bg-zinc-50">
                            <td className="px-4 py-3 font-medium text-zinc-900 capitalize">
                              {resource}
                              {anyChecked && (
                                <span className="ml-2 inline-block w-2 h-2 bg-emerald-500 rounded-full"></span>
                              )}
                            </td>
                            {operations.map((op) => (
                              <td key={`${resource}-${op}`} className="px-4 py-3 text-center">
                                <label className="inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={resourcePerms[op as keyof typeof resourcePerms] || false}
                                    onChange={() => togglePermissionOperation(resource, op)}
                                    className="accent-emerald-500 w-4 h-4"
                                  />
                                </label>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-zinc-500 mt-2">
                  • <strong>Add:</strong> Can create new items
                  • <strong>View:</strong> Can read/view items
                  • <strong>Edit:</strong> Can modify existing items
                  • <strong>Delete:</strong> Can remove items
                </p>
              </div>

              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4 shrink-0">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveRole}
                disabled={saving}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition"
              >
                {saving ? "Saving…" : editingRole ? "Save Changes" : "Create Role"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
