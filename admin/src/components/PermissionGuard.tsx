"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import Loader from "./ui/Loader.tsx";
export default function PermissionGuard({
  resource,
  operation = "view",
  children,
}: {
  resource: string;
  operation?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return router.replace("/login");

        const res = await api.get("/admin/me/permissions");
        const perms = res.data.data.permissions;

        if (perms?.[resource]?.[operation] === true) {
          setAllowed(true);
        } else {
          router.replace("/"); // no access → back to dashboard
        }
      } catch {
        router.replace("/login");
      }
    };
    check();
  }, [resource, operation]);

  if (allowed === null) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      {/* </Loader> */}<Loader />
    </div>
  );
  return <>{children}</>;
}