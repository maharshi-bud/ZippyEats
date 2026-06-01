"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import Loader from "../../../../../components/ui/Loader";
import api from "../../../../../lib/api";

export default function EditCouponPage() {
  const router = useRouter();
  const params = useParams();

  const couponId = params?.id as string;

  const [pageLoading, setPageLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [form, setForm] = useState({
    code: "",
    title: "",
    description: "",

    discountType: "PERCENTAGE",

    discountValue: "",
    maxDiscount: "",

    minimumOrderValue: "",

    usageLimit: "",
    usagePerUserLimit: "1",

    validFrom: "",
    validTill: "",

    applicableRestaurants: "",
    applicableCuisines: "",

    isActive: true,
    firstOrderOnly: false,
    newUserOnly: false,
    stackable: false,
  });

  useEffect(() => {
    if (!couponId) {
      setPageLoading(false);
      return;
    }

    fetchCoupon();
  }, [couponId]);

  const fetchCoupon = async () => {
    try {
      setPageLoading(true);
      setError("");

      const res = await api.get(
        `/admin/coupons/${couponId}`
      );

      const coupon =
        res.data?.data || res.data;

      setForm({
        code: coupon.code || "",

        title: coupon.title || "",

        description:
          coupon.description || "",

        discountType:
          coupon.reward?.type ===
          "percentage"
            ? "PERCENTAGE"
            : coupon.reward?.type ===
              "flat"
            ? "FLAT"
            : "FREE_DELIVERY",

        discountValue:
          coupon.reward?.value?.toString() ||
          "",

        maxDiscount:
          coupon.reward?.max_discount?.toString() ||
          "",

        minimumOrderValue:
          coupon.conditions?.min_order_amount?.toString() ||
          "",

        usageLimit:
          coupon.limits?.total_usage_limit?.toString() ||
          "",

        usagePerUserLimit:
          coupon.limits?.usage_per_user?.toString() ||
          "1",

        validFrom:
          coupon.validity?.start_date
            ? new Date(
                coupon.validity.start_date
              )
                .toISOString()
                .slice(0, 16)
            : "",

        validTill:
          coupon.validity?.end_date
            ? new Date(
                coupon.validity.end_date
              )
                .toISOString()
                .slice(0, 16)
            : "",

        applicableRestaurants:
          coupon.targeting?.restaurants?.join(
            ", "
          ) || "",

        applicableCuisines:
          coupon.targeting?.cuisines?.join(
            ", "
          ) || "",

        isActive:
          coupon.is_active ?? true,

        firstOrderOnly:
          coupon.visibility
            ?.first_order_only ??
          false,

        newUserOnly:
          coupon.visibility
            ?.new_user_only ??
          false,

        stackable:
          coupon.stacking
            ?.can_combine ?? false,
      });
    } catch (err: any) {
      console.error(
        "[EditCouponPage] fetch:",
        err
      );

      setError(
        err?.response?.data
          ?.message ||
          "Failed to fetch coupon"
      );
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (
    key: string,
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        code:
          form.code.trim().toUpperCase(),

        title: form.title,

        description:
          form.description,

        type: "coupon",

        is_active:
          form.isActive,

        visibility: {
          public: true,

          first_order_only:
            form.firstOrderOnly,

          new_user_only:
            form.newUserOnly,

          premium_users_only:
            false,
        },

        validity: {
          start_date:
            form.validFrom || null,

          end_date:
            form.validTill || null,

          days_allowed: [],

          time_ranges: [],

          timezone:
            "Asia/Kolkata",
        },

        targeting: {
          restaurants:
            typeof form.applicableRestaurants ===
            "string"
              ? form.applicableRestaurants
                  .split(",")
                  .map((v) =>
                    v.trim()
                  )
                  .filter(Boolean)
              : [],

          cuisines:
            typeof form.applicableCuisines ===
            "string"
              ? form.applicableCuisines
                  .split(",")
                  .map((v) =>
                    v.trim()
                  )
                  .filter(Boolean)
              : [],

          menu_items: [],
          cities: [],
          user_ids: [],
        },

        conditions: {
          min_order_amount:
            Number(
              form.minimumOrderValue
            ) || null,

          max_order_amount:
            null,

          min_items: null,

          payment_methods: [],

          allowed_platforms: [],

          order_number:
            form.firstOrderOnly
              ? {
                  min: 1,
                  max: 1,
                }
              : null,

          first_order:
            form.firstOrderOnly,

          second_order:
            false,

          min_restaurant_spend:
            null,

          requires_items: [],

          buy_x_get_y: null,
        },

        reward: {
          type:
            form.discountType ===
            "PERCENTAGE"
              ? "percentage"
              : form.discountType ===
                "FLAT"
              ? "flat"
              : "free_delivery",

          value:
            form.discountType ===
            "FREE_DELIVERY"
              ? 0
              : Number(
                  form.discountValue
                ) || 0,

          max_discount:
            form.discountType ===
            "PERCENTAGE"
              ? Number(
                  form.maxDiscount
                ) || null
              : null,

          free_item: null,

          cashback_amount:
            null,

          reward_label: "",
        },

        limits: {
          total_usage_limit:
            Number(
              form.usageLimit
            ) || null,

          usage_per_user:
            Number(
              form.usagePerUserLimit
            ) || 1,

          current_usage_count:
            0,
        },

        stacking: {
          can_combine:
            form.stackable,

          excludes: [],
        },
      };

      await api.put(
        `/admin/coupons/${couponId}`,
        payload
      );

      router.push("/coupons");
    } catch (err: any) {
      console.error(
        "[EditCouponPage] update:",
        err?.response?.data ||
          err
      );

      setError(
        err?.response?.data
          ?.message ||
          "Failed to update coupon"
      );
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">
            Edit Coupon
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Update coupon details
          </p>
        </div>

        <button
          onClick={() =>
            router.push("/coupons")
          }
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
        >
          Back
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Coupon Code
            </label>

            <input
              value={form.code}
              onChange={(e) =>
                handleChange(
                  "code",
                  e.target.value.toUpperCase()
                )
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Title
            </label>

            <input
              value={form.title}
              onChange={(e) =>
                handleChange(
                  "title",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Discount Type
            </label>

            <select
              value={form.discountType}
              onChange={(e) =>
                handleChange(
                  "discountType",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-3"
            >
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

          {form.discountType !==
            "FREE_DELIVERY" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Discount Value
              </label>

              <input
                type="number"
                value={
                  form.discountValue
                }
                onChange={(e) =>
                  handleChange(
                    "discountValue",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-zinc-200 px-4 py-3"
              />
            </div>
          )}

          {form.discountType ===
            "PERCENTAGE" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Max Discount
              </label>

              <input
                type="number"
                value={
                  form.maxDiscount
                }
                onChange={(e) =>
                  handleChange(
                    "maxDiscount",
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-zinc-200 px-4 py-3"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Minimum Order Value
            </label>

            <input
              type="number"
              value={
                form.minimumOrderValue
              }
              onChange={(e) =>
                handleChange(
                  "minimumOrderValue",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Usage Limit
            </label>

            <input
              type="number"
              value={form.usageLimit}
              onChange={(e) =>
                handleChange(
                  "usageLimit",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Usage Per User
            </label>

            <input
              type="number"
              value={
                form.usagePerUserLimit
              }
              onChange={(e) =>
                handleChange(
                  "usagePerUserLimit",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Valid From
            </label>

            <input
              type="datetime-local"
              value={form.validFrom}
              onChange={(e) =>
                handleChange(
                  "validFrom",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Valid Till
            </label>

            <input
              type="datetime-local"
              value={form.validTill}
              onChange={(e) =>
                handleChange(
                  "validTill",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Applicable Restaurants
            </label>

            <input
              value={
                form.applicableRestaurants
              }
              onChange={(e) =>
                handleChange(
                  "applicableRestaurants",
                  e.target.value
                )
              }
              placeholder="r1, r2"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Applicable Cuisines
            </label>

            <input
              value={
                form.applicableCuisines
              }
              onChange={(e) =>
                handleChange(
                  "applicableCuisines",
                  e.target.value
                )
              }
              placeholder="Indian, Italian"
              className="w-full rounded-xl border border-zinc-200 px-4 py-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Description
            </label>

            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                handleChange(
                  "description",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-3"
            />
          </div>

          <div className="md:col-span-2 grid gap-3 md:grid-cols-4">
            <label className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  handleChange(
                    "isActive",
                    e.target.checked
                  )
                }
              />

              <span>Active</span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
              <input
                type="checkbox"
                checked={
                  form.firstOrderOnly
                }
                onChange={(e) =>
                  handleChange(
                    "firstOrderOnly",
                    e.target.checked
                  )
                }
              />

              <span>
                First Order Only
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
              <input
                type="checkbox"
                checked={
                  form.newUserOnly
                }
                onChange={(e) =>
                  handleChange(
                    "newUserOnly",
                    e.target.checked
                  )
                }
              />

              <span>
                New User Only
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
              <input
                type="checkbox"
                checked={form.stackable}
                onChange={(e) =>
                  handleChange(
                    "stackable",
                    e.target.checked
                  )
                }
              />

              <span>Stackable</span>
            </label>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-zinc-900 px-6 py-3 text-white transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving
              ? "Updating..."
              : "Update Coupon"}
          </button>
        </div>
      </form>
    </div>
  );
}
