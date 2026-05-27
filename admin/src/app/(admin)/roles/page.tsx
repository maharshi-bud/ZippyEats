"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import Loader from "../../../components/ui/Loader";
import PermissionGuard from "../../../components/PermissionGuard";

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

const ROLE_COLORS: Record<string, string> = {
  user: "bg-blue-100 text-blue-700",
  restaurant: "bg-orange-100 text-orange-700",
  admin: "bg-purple-100 text-purple-700",
  super_admin: "bg-red-100 text-red-700",
};

const roleColor = (role: string) =>
  ROLE_COLORS[role] ?? "bg-zinc-100 text-zinc-700";

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────

export default function RolesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"roles" | "users">("roles");

  // ── Roles state ───────────────────────────────────────────
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState("");

  // ── Users state ───────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

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

  useEffect(() => { fetchRoles(); }, [fetchRoles]);
  useEffect(() => { if (tab === "users") fetchUsers(); }, [tab, fetchUsers]);

  // ── Delete role ───────────────────────────────────────────
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

  const countPermissions = (perms: PermissionMatrix): number =>
    Object.values(perms).reduce(
      (sum, res) => sum + Object.values(res).filter((v) => v).length,
      0
    );

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────

  return (
    <PermissionGuard resource="users" operation="edit">
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
                onClick={() => router.push("/roles/new")}
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
                              onClick={() => router.push(`/roles/${role._id}/edit`)}
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
        {/* {tab === "users" && (
          <div className="space-y-4">
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
                      <span className="flex items-center px-2">{page} / {pagination.pages}</span>
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
        )} */}

      </div>
    </PermissionGuard>
  );
}