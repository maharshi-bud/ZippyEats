"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import api from "../../../lib/api";

import type {
  Coupon,
  DiscountType,
} from "../../../components/coupons/CouponForm";

import CouponTable from "../../../components/coupons/CouponTable";

import CouponUsageCard from "../../../components/coupons/CouponUsageCard";

function unwrapList<T>(
  payload: any
): T[] {
  if (Array.isArray(payload))
    return payload;

  if (
    Array.isArray(payload?.data)
  )
    return payload.data;

  if (
    Array.isArray(
      payload?.data?.data
    )
  )
    return payload.data.data;

  if (
    Array.isArray(payload?.items)
  )
    return payload.items;

  return [];
}

export default function CouponsPage() {
  const router = useRouter();

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

  const fetchCoupons =
    async () => {
      try {
        setLoading(true);
        setError("");

        const res =
          await api.get(
            "/admin/coupons"
          );

        setCoupons(
          unwrapList<Coupon>(
            res.data
          )
        );
      } catch (err: any) {
        console.error(
          "[CouponsPage] fetch:",
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
            coupon.validity
              ?.start_date
              ? new Date(
                  coupon.validity.start_date
                ).getTime()
              : null;

          const till =
            coupon.validity
              ?.end_date
              ? new Date(
                  coupon.validity.end_date
                ).getTime()
              : null;

          const scheduled =
            from !== null &&
            from > now;

          const expired =
            till !== null &&
            till < now;

          const usageLimit =
            coupon.limits
              ?.total_usage_limit ||
            0;

          const usedCount =
            coupon.limits
              ?.current_usage_count ||
            0;

          const exhausted =
            usageLimit > 0 &&
            usedCount >=
              usageLimit;

          const active =
            Boolean(
              coupon.is_active
            ) &&
            !scheduled &&
            !expired &&
            !exhausted;

          const rewardType =
            coupon.reward
              ?.type ===
            "percentage"
              ? "PERCENTAGE"
              : coupon.reward
                    ?.type ===
                  "flat"
                ? "FLAT"
                : "FREE_DELIVERY";

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
            rewardType ===
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

  const toggleCoupon =
    async (
      coupon: Coupon
    ) => {
      try {
        setSaving(true);
        setError("");

        await api.patch(
          `/admin/coupons/${coupon._id}/toggle`
        );

        setCoupons((prev) =>
          prev.map((item) =>
            item._id ===
            coupon._id
              ? {
                  ...item,

                  is_active:
                    !item.is_active,
                }
              : item
          )
        );
      } catch (err: any) {
        console.error(
          "[CouponsPage] toggle:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            "Failed to toggle coupon."
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

        setCoupons((prev) =>
          prev.filter(
            (item) =>
              item._id !==
              coupon._id
          )
        );
      } catch (err: any) {
        console.error(
          "[CouponsPage] delete:",
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
        coupon.is_active
    ).length;

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            Admin /
            Promotions
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
          onClick={() =>
            router.push(
              "/coupons/new"
            )
          }
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
              (item.limits
                ?.current_usage_count ||
                0),
            0
          )}
          usageLimit={coupons.reduce(
            (
              acc,
              item
            ) =>
              acc +
              (item.limits
                ?.total_usage_limit ||
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
        onEdit={(
          coupon
        ) =>
          router.push(
            `/coupons/${coupon._id}/edit`
          )
        }
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
    </div>
  );
}