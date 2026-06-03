"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CouponForm, { type CouponPayload } from "../../../../components/coupons/CouponForm";
import api from "../../../../lib/api";

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload: CouponPayload) => {
    setLoading(true);
    try {
      await api.post("/admin/coupons", payload);
      router.push("/coupons");
    } catch (error: any) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/coupons");
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-4xl">
        <CouponForm
          mode="create"
          loading={loading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}