"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import CouponForm from "../../../../components/coupons/CouponForm";
import Loader from "../../../../components/ui/Loader";

import api from "../../../../lib/api";

export default function NewCouponPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (payload: any) => {
    try {
      setLoading(true);
      setError("");
const formattedPayload = {
  code: payload.code.trim().toUpperCase(),

  title: payload.title,

  description: payload.description,

  discountType: payload.discountType,

  discountValue:
    payload.discountType ===
    "FREE_DELIVERY"
      ? 0
      : Number(payload.discountValue),

  maxDiscount:
    payload.discountType ===
    "PERCENTAGE"
      ? Number(payload.maxDiscount)
      : null,

  minimumOrderValue:
    Number(payload.minimumOrderValue) || 0,

  usageLimit:
    Number(payload.usageLimit) || 0,

  usagePerUserLimit:
    Number(payload.usagePerUserLimit) || 1,

  validFrom:
    payload.validFrom || null,

  validTill:
    payload.validTill || null,

  applicableRestaurants:
    payload.applicableRestaurants
      ?.split(",")
      .map((v: string) => v.trim())
      .filter(Boolean) || [],

  applicableCuisines:
    payload.applicableCuisines
      ?.split(",")
      .map((v: string) => v.trim())
      .filter(Boolean) || [],

  isActive: payload.isActive,

  firstOrderOnly:
    payload.firstOrderOnly,

  newUserOnly:
    payload.newUserOnly,

  stackable:
    payload.stackable,
};

    //   await api.post("/admin/coupons", payload);
await api.post(
  "/admin/coupons",
  formattedPayload
);


      router.push("/coupons");
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Failed to create coupon"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Create Coupon
          </h1>

          <p className="text-sm text-zinc-400 mt-1">
            Create a new coupon for ZippyEats
          </p>
        </div>

        <button
          onClick={() => router.push("/coupons")}
          className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader />
        </div>
      ) : (
        <CouponForm
          onSubmit={handleCreate}
          loading={loading}
        />
      )}
    </div>
  );
}
