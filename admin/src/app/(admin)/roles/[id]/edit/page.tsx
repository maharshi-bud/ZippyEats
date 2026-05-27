"use client";

// ============================================================
// FILE: admin/src/app/(admin)/roles/[id]/edit/page.tsx
// ============================================================

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "../../../../../lib/api";
import RoleForm from "../../RoleForm";
import PermissionGuard from "../../../../../components/PermissionGuard";

type PermissionOps = { add: boolean; view: boolean; edit: boolean; delete: boolean };
type PermissionMatrix = { [key: string]: PermissionOps };
type ModuleTree = { key: string; name: string; index: number; children: any[] };

export default function EditRolePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [tree, setTree] = useState<ModuleTree[]>([]);
  const [operations, setOperations] = useState<string[]>(["add", "view", "edit", "delete"]);
  const [form, setForm] = useState({ name: "", label: "", description: "", permissions: {} as PermissionMatrix });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/roles/resources"),
      api.get("/admin/roles"),
    ]).then(([resRes, rolesRes]) => {
      const { tree: t, operations: o } = resRes.data.data;
      setTree(t || []);
      setOperations(o || ["add", "view", "edit", "delete"]);

      const role = rolesRes.data.data.find((r: any) => r._id === id);
      if (role) {
        // Build permissions — ensure all parent keys exist
        const perms: PermissionMatrix = {};
        (t || []).forEach((mod: ModuleTree) => {
          perms[mod.key] = role.permissions?.[mod.key] || { add: false, view: false, edit: false, delete: false };
        });
        setForm({
          name: role.name,
          label: role.label || "",
          description: role.description || "",
          permissions: perms,
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

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
    try {
      setSaving(true);
      setError("");
      await api.put(`/admin/roles/${id}`, {
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

  if (loading) return <div className="p-8 text-sm text-zinc-400">Loading role...</div>;

  return (
    <PermissionGuard resource="users" operation="edit">
      <RoleForm
        title={`Edit "${form.label || form.name}"`}
        form={form}
        setForm={setForm}
        tree={tree}
        operations={operations}
        toggle={toggle}
        save={save}
        saving={saving}
        error={error}
        onCancel={() => router.push("/roles")}
        isEditing={true}
      />
    </PermissionGuard>
  );
}