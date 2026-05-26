"use client";

// ============================================================
// FILE: admin/src/app/(admin)/roles/[id]/edit/page.tsx
// ============================================================

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "../../../../../lib/api";
import RoleForm from "../..//RoleForm";
import PermissionGuard from "../../../../../components/PermissionGuard";

type PermissionMatrix = {
  [resource: string]: { add: boolean; view: boolean; edit: boolean; delete: boolean };
};

export default function EditRolePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [resources, setResources] = useState<string[]>([]);
  const [operations, setOperations] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    label: "",
    description: "",
    permissions: {} as PermissionMatrix,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/admin/roles/resources"),
      api.get("/admin/roles"),
    ]).then(([resRes, rolesRes]) => {
      const { resources: r, operations: o } = resRes.data.data;
      setResources(r);
      setOperations(o);

      const role = rolesRes.data.data.find((role: any) => role._id === id);
      if (role) {
        setForm({
          name: role.name,
          label: role.label || "",
          description: role.description || "",
          permissions: { ...role.permissions },
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const toggle = (resource: string, op: string) => {
    setForm((f) => ({
      ...f,
      permissions: {
        ...f.permissions,
        [resource]: {
          ...f.permissions[resource],
          [op]: !f.permissions[resource]?.[op as keyof typeof f.permissions[string]],
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

  if (loading) {
    return <div className="p-8 text-sm text-zinc-400">Loading role...</div>;
  }

  return (
    <PermissionGuard resource="users" operation="edit">
      <RoleForm
        title={`Edit "${form.label || form.name}"`}
        form={form}
        setForm={setForm}
        resources={resources}
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