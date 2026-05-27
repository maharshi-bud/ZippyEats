"use client";

// ============================================================
// FILE: admin/src/app/(admin)/roles/new/page.tsx
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import RoleForm from "../RoleForm";
import PermissionGuard from "../../../../components/PermissionGuard";

type PermissionOps = { add: boolean; view: boolean; edit: boolean; delete: boolean };
type PermissionMatrix = { [key: string]: PermissionOps };
type ModuleTree = { key: string; name: string; index: number; children: any[] };

export default function NewRolePage() {
  const router = useRouter();
  const [tree, setTree] = useState<ModuleTree[]>([]);
  const [operations, setOperations] = useState<string[]>(["add", "view", "edit", "delete"]);
  const [form, setForm] = useState({ name: "", label: "", description: "", permissions: {} as PermissionMatrix });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/admin/roles/resources").then((res) => {
      const { tree: t, operations: o } = res.data.data;
      setTree(t || []);
      setOperations(o || ["add", "view", "edit", "delete"]);

      // Init permissions with all parent keys as false
      const emptyPerms: PermissionMatrix = {};
      (t || []).forEach((mod: ModuleTree) => {
        emptyPerms[mod.key] = { add: false, view: false, edit: false, delete: false };
      });
      setForm((f) => ({ ...f, permissions: emptyPerms }));
    });
  }, []);

  const toggle = (parentKey: string, op: string) => {
    setForm((f) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [parentKey]: {
          ...f.permissions[parentKey],
          [op]: !f.permissions[parentKey]?.[op as keyof PermissionOps],
        },
      },
    }));
  };

  const save = async () => {
    if (!form.name.trim()) return setError("Role name is required");
    try {
      setSaving(true);
      setError("");
      await api.post("/admin/roles", {
        name: form.name.toLowerCase().replace(/\s+/g, "_"),
        label: form.label,
        description: form.description,
        permissions: form.permissions,
      });
      router.push("/roles");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGuard resource="users" operation="add">
      <RoleForm
        title="Create New Role"
        form={form}
        setForm={setForm}
        tree={tree}
        operations={operations}
        toggle={toggle}
        save={save}
        saving={saving}
        error={error}
        onCancel={() => router.push("/roles")}
        isEditing={false}
      />
    </PermissionGuard>
  );
}