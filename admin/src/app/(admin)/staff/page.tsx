"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import {
  Search,
  Plus,
  Shield,
  Mail,
  Calendar,
  X,
  ChevronDown,
  Check,
  AlertTriangle,
} from "lucide-react";

type StaffUser = {
  _id: string;
  name?: string;
  email?: string;
  role: string;
  createdAt?: string;
};

export default function StaffPage() {

  // =====================================================
  // STATE
  // =====================================================

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Edit-role modal
  const [modalOpen, setModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<StaffUser[]>([]);
  const [modalSearch, setModalSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Confirm-remove modal
  const [removeTarget, setRemoveTarget] = useState<StaffUser | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState("");

  // =====================================================
  // FETCH STAFF
  // =====================================================

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get("admin/users");
      const data = res.data?.data || res.data || [];
      const staff = data.filter(
        (u: StaffUser) => !["user", "restaurant"].includes(u.role)
      );
      setUsers(staff);
    } catch (err) {
      console.error("FAILED TO FETCH STAFF:", err);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // OPEN EDIT-ROLE MODAL
  // optionalUser — when called from inline "Edit" button,
  // pre-selects that specific staff member
  // =====================================================

  const openModal = async (optionalUser?: StaffUser) => {
    setModalOpen(true);
    setModalSearch("");
    setSelectedUser(optionalUser ?? null);
    setSelectedRole(optionalUser?.role ?? "");
    setModalError("");

    try {
      setModalLoading(true);

      // Fetch users + roles in parallel
      const [usersRes, rolesRes] = await Promise.allSettled([
        api.get("admin/users"),
        api.get("admin/roles"),
      ]);

      // ── Users ──
      let derivedUsers: StaffUser[] = [];
      if (usersRes.status === "fulfilled") {
        derivedUsers = usersRes.value.data?.data || usersRes.value.data || [];
        setAllUsers(derivedUsers);
      } else {
        setModalError("Failed to load users. Please try again.");
      }

      // ── Roles: try dedicated endpoint, fall back to unique roles in user list ──
      if (rolesRes.status === "fulfilled") {
        const raw = rolesRes.value.data?.data || rolesRes.value.data || [];
        // Supports both string[] and { name: string }[] responses
        const roles: string[] = raw
          .map((r: string | { name: string }) =>
            typeof r === "string" ? r : r.name
          )
          .filter(Boolean);
        setAvailableRoles(
          roles.length > 0
            ? roles
            : Array.from(
                new Set<string>(derivedUsers.map((u) => u.role).filter(Boolean))
              ).sort()
        );
      } else {
        // /admin/roles not registered — derive from users
        setAvailableRoles(
          Array.from(
            new Set<string>(derivedUsers.map((u) => u.role).filter(Boolean))
          ).sort()
        );
      }
    } catch (err) {
      console.error("FAILED TO FETCH MODAL DATA:", err);
      setModalError("Failed to load data. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setSelectedRole("");
    setModalError("");
  };

  // =====================================================
  // SAVE ROLE  →  PATCH /admin/users/:id/role
  // =====================================================

  const saveRole = async () => {
    if (!selectedUser || !selectedRole) return;
    try {
      setSaving(true);
      setModalError("");

      // Correct endpoint confirmed from rolesRoutes.js
      await api.patch(`admin/users/${selectedUser._id}/role`, {
        role: selectedRole,
      });

      await fetchStaff();
      closeModal();
    } catch (err: any) {
      console.error("FAILED TO UPDATE ROLE:", err);
      setModalError(
        err?.response?.data?.message || "Failed to update role. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // REMOVE (demote to "user")  →  PATCH /admin/users/:id/role
  // =====================================================

  const confirmRemove = (user: StaffUser) => {
    setRemoveTarget(user);
    setRemoveError("");
  };

  const doRemove = async () => {
    if (!removeTarget) return;
    try {
      setRemoving(true);
      setRemoveError("");

      // Demotes the staff member back to the base "user" role
      await api.patch(`admin/users/${removeTarget._id}/role`, {
        role: "user",
      });

      await fetchStaff();
      setRemoveTarget(null);
    } catch (err: any) {
      console.error("FAILED TO REMOVE STAFF:", err);
      setRemoveError(
        err?.response?.data?.message || "Failed to remove staff member."
      );
    } finally {
      setRemoving(false);
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredStaff = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const filteredModalUsers = allUsers.filter((u) => {
    const q = modalSearch.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Staff Management</h1>
          <p className="mt-1 text-sm text-slate-500">Admin users with dashboard access</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          <Plus size={16} />
          Add Staff
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative w-full max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search staff..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400"
        />
      </div>

      {/* LOADING */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-sm">
          Loading staff...
        </div>
      )}

      {/* TABLE */}
      {!loading && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr className="text-left text-sm text-slate-500">
                <th className="p-4">Staff</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400">
                    No staff found
                  </td>
                </tr>
              )}

              {filteredStaff.map((user) => (
                <tr key={user._id} className="border-b transition hover:bg-slate-50">

                  {/* USER */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 font-bold uppercase">
                        {user.name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">ID: {user._id?.slice(-6)}</p>
                      </div>
                    </div>
                  </td>

                  {/* EMAIL */}
                  <td className="p-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      {user.email}
                    </div>
                  </td>

                  {/* ROLE */}
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      <Shield size={12} />
                      {user.role}
                    </span>
                  </td>

                  {/* JOINED */}
                  <td className="p-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "-"}
                    </div>
                  </td>

                  {/* ACTIONS */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {/* Edit — opens modal pre-filled with this user */}
                      <button
                        onClick={() => openModal(user)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium transition hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      {/* Remove — opens confirm dialog */}
                      <button
                        onClick={() => confirmRemove(user)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ================================================= */}
      {/* EDIT-ROLE MODAL                                    */}
      {/* ================================================= */}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edit user to staff</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select a user and assign a new role
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">

              {/* User search */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">
                  Search User
                </label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="Name or email..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  />
                </div>
              </div>

              {/* User list */}
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200">
                {modalLoading && (
                  <div className="p-6 text-center text-sm text-slate-400">
                    Loading users...
                  </div>
                )}
                {!modalLoading && filteredModalUsers.length === 0 && (
                  <div className="p-6 text-center text-sm text-slate-400">
                    No users found
                  </div>
                )}
                {!modalLoading &&
                  filteredModalUsers.map((u) => {
                    const isSelected = selectedUser?._id === u._id;
                    return (
                      <button
                        key={u._id}
                        onClick={() => {
                          setSelectedUser(u);
                          setSelectedRole(u.role);
                        }}
                        className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left transition last:border-0 ${
                          isSelected
                            ? "bg-slate-900 text-white"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold uppercase text-sm ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {u.name?.[0] || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-medium ${isSelected ? "text-white" : "text-slate-900"}`}>
                            {u.name || "Unnamed"}
                          </p>
                          <p className={`truncate text-xs ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                            {u.email} · <span className="italic">{u.role}</span>
                          </p>
                        </div>
                        {isSelected && <Check size={16} className="shrink-0 text-white" />}
                      </button>
                    );
                  })}
              </div>

              {/* Role selector */}
              {selectedUser && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    New Role for{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedUser.name}
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-9 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    >
                      <option value="">
                        {modalLoading ? "Loading roles…" : "— Select a role —"}
                      </option>
                      {availableRoles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* Error */}
              {modalError && (
                <p className="rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">
                  {modalError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t px-5 py-4">
              <button
                onClick={closeModal}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveRole}
                disabled={!selectedUser || !selectedRole || saving}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Saving..." : "Save Role"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* CONFIRM-REMOVE MODAL                               */}
      {/* ================================================= */}

      {removeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">

            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle size={22} className="text-red-600" />
              </div>
              <h2 className="text-base font-semibold text-slate-900">
                Remove Staff Access
              </h2>
              <p className="text-sm text-slate-500">
                This will demote{" "}
                <span className="font-medium text-slate-800">
                  {removeTarget.name}
                </span>{" "}
                from{" "}
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                  {removeTarget.role}
                </span>{" "}
                back to a regular user. They will lose all admin access.
              </p>

              {removeError && (
                <p className="w-full rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">
                  {removeError}
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setRemoveTarget(null)}
                disabled={removing}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={doRemove}
                disabled={removing}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {removing ? "Removing..." : "Yes, Remove"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}