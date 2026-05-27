"use client";

// ============================================================
// FILE: admin/src/components/roles/RoleForm.tsx
// ── Permissions matrix with parent-child hierarchy ───────────
// Parents are the only checkable rows.
// Checking a parent grants that operation to all its children.
// ============================================================

import { useRouter } from "next/navigation";

type PermissionOps = {
  add: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
};

type PermissionMatrix = {
  [parentKey: string]: PermissionOps;
};

type ModuleChild = {
  key: string;
  name: string;
  index: number;
};

type ModuleTree = {
  key: string;
  name: string;
  index: number;
  children: ModuleChild[];
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
  tree: ModuleTree[];       // from GET /admin/roles/resources → data.tree
  operations: string[];
  toggle: (parentKey: string, op: string) => void;
  save: () => void;
  saving: boolean;
  error: string;
  onCancel: () => void;
  isEditing?: boolean;
};

const OPERATIONS = ["add", "view", "edit", "delete"];

export default function RoleForm({
  title,
  form,
  setForm,
  tree,
  operations = OPERATIONS,
  toggle,
  save,
  saving,
  error,
  onCancel,
  isEditing = false,
}: RoleFormProps) {

  const toggleAll = (parentKey: string) => {
    const current = form.permissions[parentKey] || { add: false, view: false, edit: false, delete: false };
    const allTrue = operations.every((op) => current[op as keyof PermissionOps]);
    const newValue = !allTrue;
    setForm((f: any) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [parentKey]: Object.fromEntries(operations.map((op) => [op, newValue])),
      },
    }));
  };

  const countGranted = (parentKey: string) => {
    const perms = form.permissions[parentKey];
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
          <button onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition">
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Role"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* BASIC INFO */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Role Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">
              Role Name (slug){" "}
              {isEditing && <span className="text-zinc-400">— cannot be changed</span>}
            </label>
            <input
              type="text"
              value={form.name}
              disabled={isEditing}
              onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, "_") }))}
              placeholder="e.g. support_agent"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-zinc-50 disabled:text-zinc-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1">Display Label</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm((f: any) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Support Agent"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
            placeholder="What is this role for?"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      {/* PERMISSIONS MATRIX */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Permissions Matrix</h2>
          <span className="text-xs text-zinc-400">Granting a parent gives access to all its sub-modules</span>
        </div>

        <div className="overflow-x-auto border border-zinc-200 rounded-lg">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-4 py-3 text-left font-medium text-zinc-700 w-56">Module</th>
                {operations.map((op) => (
                  <th key={op} className="px-4 py-3 text-center font-medium text-zinc-700 capitalize">{op}</th>
                ))}
                <th className="px-4 py-3 text-center font-medium text-zinc-400 w-14">All</th>
              </tr>
            </thead>
            <tbody>
              {tree.map((parent) => {
                const perms = form.permissions[parent.key] || { add: false, view: false, edit: false, delete: false };
                const granted = countGranted(parent.key);
                const allGranted = granted === operations.length;
                const hasChildren = parent.children && parent.children.length > 0;

                return (
                  <>
                    {/* PARENT ROW */}
                    <tr key={parent.key} className="border-b border-zinc-200 bg-white hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAll(parent.key)}
                            className="font-semibold text-zinc-900 capitalize hover:text-emerald-600 transition text-left flex items-center gap-1.5"
                          >
                            {parent.name}
                            {granted > 0 && (
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
                                {granted}
                              </span>
                            )}
                          </button>
                        </div>
                        {hasChildren && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {parent.children.map((child) => (
                              <span
                                key={child.key}
                                className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                  granted > 0
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-zinc-50 border-zinc-200 text-zinc-400"
                                }`}
                              >
                                {child.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {operations.map((op) => (
                        <td key={`${parent.key}-${op}`} className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={perms[op as keyof PermissionOps] || false}
                            onChange={() => toggle(parent.key, op)}
                            className="accent-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                      ))}

                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={allGranted}
                          onChange={() => toggleAll(parent.key)}
                          className="accent-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-zinc-400 mt-3 flex flex-wrap gap-x-4 gap-y-1">
          <span>• <strong className="text-zinc-500">Add:</strong> Create</span>
          <span>• <strong className="text-zinc-500">View:</strong> Read</span>
          <span>• <strong className="text-zinc-500">Edit:</strong> Modify</span>
          <span>• <strong className="text-zinc-500">Delete:</strong> Remove</span>
          <span className="text-zinc-300">|</span>
          <span>• Child modules shown as tags — they inherit the parent's permission</span>
        </p>
      </div>

      {/* BOTTOM SAVE */}
      <div className="flex justify-end gap-3 pb-8">
        <button onClick={onCancel} className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition">
          Cancel
        </button>
        <button onClick={save} disabled={saving} className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition">
          {saving ? "Saving…" : isEditing ? "Save Changes" : "Create Role"}
        </button>
      </div>
    </div>
  );
}