"use client";

import { useEffect, useMemo, useState } from "react";

import api from "../../../lib/api";

import CouponForm, {
  type Coupon,
  type CouponPayload,
  type DiscountType,
} from "../../../components/coupons/CouponForm";

import CouponTable from "../../../components/coupons/CouponTable";

import CouponUsageCard from "../../../components/coupons/CouponUsageCard";

function unwrapList<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data))
    return payload.data.data;
  if (Array.isArray(payload?.items))
    return payload.items;

  return [];
}

export default function CouponsPage() {
  const [coupons, setCoupons] =
    useState<Coupon[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [query, setQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      | "all"
      | "active"
      | "inactive"
      | "expired"
      | "scheduled"
      | "exhausted"
    >("all");

  const [typeFilter, setTypeFilter] =
    useState<
      "all" | DiscountType
    >("all");

  const [showForm, setShowForm] =
    useState(false);

  const [editingCoupon, setEditingCoupon] =
    useState<Coupon | null>(null);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(
        "/admin/coupons"
      );

      setCoupons(
        unwrapList<Coupon>(
          res.data
        )
      );
    } catch (err: any) {
      console.error(
        "[CouponsPage] fetchCoupons:",
        err
      );

      setError(
        err?.response?.data
          ?.message ||
          "Failed to load coupons."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const filteredCoupons =
    useMemo(() => {
      const needle =
        query
          .trim()
          .toLowerCase();

      return coupons.filter(
        (coupon) => {
          const now =
            Date.now();

          const from =
            coupon.validFrom
              ? new Date(
                  coupon.validFrom
                ).getTime()
              : null;

          const till =
            coupon.validTill
              ? new Date(
                  coupon.validTill
                ).getTime()
              : null;

          const scheduled =
            from !== null &&
            from > now;

          const expired =
            till !== null &&
            till < now;

          const exhausted =
            typeof coupon.usageLimit ===
              "number" &&
            coupon.usageLimit >
              0 &&
            typeof coupon.usedCount ===
              "number" &&
            coupon.usedCount >=
              coupon.usageLimit;

          const active =
            Boolean(
              coupon.isActive
            ) &&
            !scheduled &&
            !expired &&
            !exhausted;

          const matchesQuery =
            !needle ||
            coupon.code
              ?.toLowerCase()
              .includes(
                needle
              ) ||
            coupon.title
              ?.toLowerCase()
              .includes(
                needle
              ) ||
            coupon.description
              ?.toLowerCase()
              .includes(
                needle
              );

          const matchesType =
            typeFilter ===
              "all" ||
            coupon.discountType ===
              typeFilter;

          const matchesStatus =
            statusFilter ===
              "all" ||
            (statusFilter ===
              "active" &&
              active) ||
            (statusFilter ===
              "inactive" &&
              !active &&
              !expired &&
              !scheduled &&
              !exhausted) ||
            (statusFilter ===
              "expired" &&
              expired) ||
            (statusFilter ===
              "scheduled" &&
              scheduled) ||
            (statusFilter ===
              "exhausted" &&
              exhausted);

          return (
            matchesQuery &&
            matchesType &&
            matchesStatus
          );
        }
      );
    }, [
      coupons,
      query,
      statusFilter,
      typeFilter,
    ]);

  const openCreate = () => {
    setEditingCoupon(null);
    setShowForm(true);
  };

  const openEdit = (
    coupon: Coupon
  ) => {
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCoupon(null);
  };

  const handleSave = async (
    payload: CouponPayload
  ) => {
    try {
      setSaving(true);
      setError("");

      if (
        editingCoupon?._id
      ) {
        await api.put(
          `/admin/coupons/${editingCoupon._id}`,
          payload
        );
      } else {
        await api.post(
          "/admin/coupons",
          payload
        );
      }

      await fetchCoupons();

      closeForm();
    } catch (err: any) {
      console.error(
        "[CouponsPage] saveCoupon:",
        err
      );

      setError(
        err?.response?.data
          ?.message ||
          "Failed to save coupon."
      );

      throw err;
    } finally {
      setSaving(false);
    }
  };

  const toggleCoupon =
    async (
      coupon: Coupon
    ) => {
      try {
        setSaving(true);
        setError("");

        await api.put(
          `/admin/coupons/${coupon._id}`,
          {
            ...coupon,
            isActive:
              !coupon.isActive,
          }
        );

        await fetchCoupons();
      } catch (err: any) {
        console.error(
          "[CouponsPage] toggleCoupon:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            "Failed to update coupon."
        );
      } finally {
        setSaving(false);
      }
    };

  const deleteCoupon =
    async (
      coupon: Coupon
    ) => {
      const confirmed =
        window.confirm(
          `Delete coupon "${coupon.code}"?`
        );

      if (!confirmed)
        return;

      try {
        setSaving(true);
        setError("");

        await api.delete(
          `/admin/coupons/${coupon._id}`
        );

        setCoupons(
          (prev) =>
            prev.filter(
              (item) =>
                item._id !==
                coupon._id
            )
        );
      } catch (err: any) {
        console.error(
          "[CouponsPage] deleteCoupon:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            "Failed to delete coupon."
        );
      } finally {
        setSaving(false);
      }
    };

  const activeCoupons =
    coupons.filter(
      (coupon) =>
        coupon.isActive
    ).length;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Admin / Promotions
          </p>

          <h1 className="text-3xl font-semibold text-zinc-900">
            Coupons
          </h1>

          <p className="mt-2 text-sm text-zinc-600">
            Manage coupon
            campaigns,
            restrictions,
            and usage.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
        >
          + New Coupon
        </button>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <CouponUsageCard
          code="TOTAL"
          usedCount={coupons.reduce(
            (
              acc,
              item
            ) =>
              acc +
              (item.usedCount ||
                0),
            0
          )}
          usageLimit={coupons.reduce(
            (
              acc,
              item
            ) =>
              acc +
              (item.usageLimit ||
                0),
            0
          )}
          totalSavingsGiven={0}
          isActive
        />

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">
            Total Coupons
          </p>

          <p className="mt-2 text-4xl font-semibold text-zinc-900">
            {coupons.length}
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">
            Active Coupons
          </p>

          <p className="mt-2 text-4xl font-semibold text-zinc-900">
            {
              activeCoupons
            }
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <input
              value={query}
              onChange={(e) =>
                setQuery(
                  e.target.value
                )
              }
              placeholder="Search by coupon code, title..."
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
            />
          </div>

          <select
            value={
              statusFilter
            }
            onChange={(e) =>
              setStatusFilter(
                e.target
                  .value as typeof statusFilter
              )
            }
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
          >
            <option value="all">
              All Statuses
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>

            <option value="scheduled">
              Scheduled
            </option>

            <option value="expired">
              Expired
            </option>

            <option value="exhausted">
              Exhausted
            </option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target
                  .value as typeof typeFilter
              )
            }
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
          >
            <option value="all">
              All Types
            </option>

            <option value="PERCENTAGE">
              Percentage
            </option>

            <option value="FLAT">
              Flat
            </option>

            <option value="FREE_DELIVERY">
              Free Delivery
            </option>
          </select>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
      </div>

      <CouponTable
        coupons={
          filteredCoupons
        }
        loading={loading}
        onEdit={openEdit}
        onDelete={
          deleteCoupon
        }
        onToggle={
          toggleCoupon
        }
        actionLoading={
          saving
        }
      />

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <CouponForm
              mode={
                editingCoupon
                  ? "edit"
                  : "create"
              }
              initialData={
                editingCoupon
              }
              loading={saving}
              onSubmit={
                handleSave
              }
              onCancel={
                closeForm
              }
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}