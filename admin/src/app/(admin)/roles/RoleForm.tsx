"use client";

// ============================================================
// FILE: admin/src/components/roles/RoleForm.tsx
// ============================================================

import { useRouter } from "next/navigation";

type PermissionMatrix = {
  [resource: string]: {
    add: boolean;
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
};

type RoleFormProps = {
  title: string;
  form: {
    name: string;
    label: string;
    description: string;
    permissions: PermissionMatrix;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  resources: string[];
  operations: string[];
  toggle: (resource: string, op: string) => void;
  save: () => void;
  saving: boolean;
  error: string;
  onCancel: () => void;
  isEditing?: boolean;
};

export default function RoleForm({
  title,
  form,
  setForm,
  resources,
  operations,
  toggle,
  save,
  saving,
  error,
  onCancel,
  isEditing = false,
}: RoleFormProps) {

  const toggleAll = (resource: string) => {
    const current = form.permissions[resource] || { add: false, view: false, edit: false, delete: false };
    const allTrue = operations.every((op) => current[op as keyof typeof current]);
    const newValue = !allTrue;
    setForm((f: any) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [resource]: Object.fromEntries(operations.map((op) => [op, newValue])),
      },
    }));
  };

  const countGranted = (resource: string) => {
    const perms = form.permissions[resource];
    if (!perms) return 0;
    return Object.values(perms).filter(Boolean).length;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onCancel}
            className="mb-2 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition"
          >
            ← Back to Roles
          </button>
          <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition"
          >
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Role"}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* BASIC INFO */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
          Role Details
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Role Name (slug){" "}
              {isEditing && (
                <span className="text-zinc-400">— cannot be changed</span>
              )}
            </label>
            <input
              type="text"
              value={form.name}
              disabled={isEditing}
              onChange={(e) =>
                setForm((f: any) => ({
                  ...f,
                  name: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                }))
              }
              placeholder="e.g. support_agent"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-zinc-50 disabled:text-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Display Label
            </label>
            <input
              type="text"
              value={form.label}
              onChange={(e) =>
                setForm((f: any) => ({ ...f, label: e.target.value }))
              }
              placeholder="e.g. Support Agent"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">
            Description
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) =>
              setForm((f: any) => ({ ...f, description: e.target.value }))
            }
            placeholder="What is this role for?"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      {/* PERMISSION MATRIX */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
            Permissions Matrix
          </h2>
          <span className="text-xs text-zinc-400">
            Click row name to toggle all
          </span>
        </div>

        <div className="overflow-x-auto border border-zinc-200 rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 text-left font-medium text-zinc-700 w-48">
                  Resource
                </th>
                {operations.map((op) => (
                  <th
                    key={op}
                    className="px-4 py-3 text-center font-medium text-zinc-700 capitalize"
                  >
                    {op}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-medium text-zinc-400 w-16">
                  All
                </th>
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
                const granted = countGranted(resource);
                const allGranted = granted === operations.length;

                return (
                  <tr
                    key={resource}
                    className="border-b border-zinc-100 hover:bg-zinc-50"
                  >
                    {/* Resource name — click to toggle all */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAll(resource)}
                        className="flex items-center gap-2 font-medium text-zinc-900 capitalize hover:text-emerald-600 transition text-left"
                      >
                        {resource}
                        {granted > 0 && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                            {granted}
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Per-operation checkboxes */}
                    {operations.map((op) => (
                      <td
                        key={`${resource}-${op}`}
                        className="px-4 py-3 text-center"
                      >
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              resourcePerms[
                                op as keyof typeof resourcePerms
                              ] || false
                            }
                            onChange={() => toggle(resource, op)}
                            className="accent-emerald-500 w-4 h-4"
                          />
                        </label>
                      </td>
                    ))}

                    {/* Toggle all checkbox */}
                    <td className="px-4 py-3 text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allGranted}
                          onChange={() => toggleAll(resource)}
                          className="accent-emerald-500 w-4 h-4"
                        />
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-zinc-400 mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span>• <strong className="text-zinc-500">Add:</strong> Can create new items</span>
          <span>• <strong className="text-zinc-500">View:</strong> Can read/view items</span>
          <span>• <strong className="text-zinc-500">Edit:</strong> Can modify existing items</span>
          <span>• <strong className="text-zinc-500">Delete:</strong> Can remove items</span>
        </p>
      </div>

      {/* BOTTOM SAVE */}
      <div className="flex justify-end gap-3 pb-8">
        <button
          onClick={onCancel}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Role"}
        </button>
      </div>

    </div>
  );
}