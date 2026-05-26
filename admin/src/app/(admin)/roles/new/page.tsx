"use client";

// ============================================================
// FILE: admin/src/app/(admin)/roles/new/page.tsx
// ============================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../../lib/api";
import RoleForm from "../RoleForm";
import PermissionGuard from "../../../../components/PermissionGuard";

type PermissionMatrix = {
  [resource: string]: { add: boolean; view: boolean; edit: boolean; delete: boolean };
};

export default function NewRolePage() {
  const router = useRouter();
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

  useEffect(() => {
    api.get("/admin/roles/resources").then((res) => {
      const { resources: r, operations: o } = res.data.data;
      setResources(r);
      setOperations(o);
      const emptyPerms: PermissionMatrix = {};
      r.forEach((resource: string) => {
        emptyPerms[resource] = { add: false, view: false, edit: false, delete: false };
      });
      setForm((f) => ({ ...f, permissions: emptyPerms }));
    });
  }, []);

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
        resources={resources}
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