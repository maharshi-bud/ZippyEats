"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CouponForm, { type CouponPayload, type Coupon } from "../../../../../components/coupons/CouponForm";
import api from "../../../../../lib/api";

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();
  const couponId = params?.id as string;

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCoupon = async () => {
      if (!couponId) return;
      
      try {
        setFetching(true);
        const response = await api.get(`/admin/coupons/${couponId}`);
        setCoupon(response.data.data || response.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch coupon"
        );
      } finally {
        setFetching(false);
      }
    };

    fetchCoupon();
  }, [couponId]);

  const handleSubmit = async (payload: CouponPayload) => {
    setLoading(true);
    try {
      await api.put(`/admin/coupons/${couponId}`, payload);
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

  if (fetching) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-zinc-600">Loading coupon...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => router.push("/coupons")}
              className="mt-3 text-sm underline hover:no-underline"
            >
              Back to Coupons
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!coupon) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-zinc-600 mb-4">Coupon not found</p>
            <button
              onClick={() => router.push("/coupons")}
              className="text-sm text-zinc-900 underline hover:no-underline"
            >
              Back to Coupons
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-4xl">
        <CouponForm
          mode="edit"
          initialData={coupon}
          loading={loading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}