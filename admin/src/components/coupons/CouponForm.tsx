"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

export type DiscountType =
  | "PERCENTAGE"
  | "FLAT"
  | "FREE_DELIVERY";

export type Coupon = {
  _id?: string;
  code: string;
  title?: string;
  description?: string;

  
  discountType: DiscountType;
  discountValue?: number | null;
  maxDiscount?: number | null;

  minimumOrderValue?: number | null;

  applicableRestaurants?: Array<
    string | { _id?: string; name?: string }
  >;

  applicableCuisines?: string[];

  validFrom?: string | Date | null;
  validTill?: string | Date | null;

  usageLimit?: number | null;
  usagePerUserLimit?: number | null;

  usedCount?: number;

  isActive?: boolean;

  firstOrderOnly?: boolean;
  newUserOnly?: boolean;
  stackable?: boolean;

  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type CouponPayload = {
  code: string;
  title: string;
  description: string;

  type: "coupon";
  isActive: boolean;

  validity: {
    start_date: string | null;
    end_date: string | null;
  };

  targeting: {
    restaurants: string[];
    cuisines: string[];
  };

  conditions: {
    minimum_order_value: number | null;
    first_order_only: boolean;
    new_user_only: boolean;
  };

  reward: {
    type: "percentage" | "flat" | "free_delivery";
    value: number;
    max_discount: number | null;
  };

  limits: {
    total_usage_limit: number | null;
    usage_per_user: number;
  };

  stacking: {
    can_combine: boolean;
    excludes: string[];
  };
};

type CouponFormState = {
  code: string;
  title: string;
  description: string;

  discountType: DiscountType;

  discountValue: string;
  maxDiscount: string;

  minimumOrderValue: string;

  applicableRestaurants: string;
  applicableCuisines: string;

  validFrom: string;
  validTill: string;

  usageLimit: string;
  usagePerUserLimit: string;

  firstOrderOnly: boolean;
  newUserOnly: boolean;
  stackable: boolean;

  isActive: boolean;
};

interface CouponFormProps {
  mode: "create" | "edit";
  initialData?: Coupon | null;

  loading?: boolean;

  onSubmit: (
    payload: CouponPayload
  ) => Promise<void>;

  onCancel?: () => void;
}

const EMPTY_FORM: CouponFormState = {
  code: "",
  title: "",
  description: "",

  discountType: "PERCENTAGE",

  discountValue: "",
  maxDiscount: "",

  minimumOrderValue: "",

  applicableRestaurants: "",
  applicableCuisines: "",

  validFrom: "",
  validTill: "",

  usageLimit: "",
  usagePerUserLimit: "1",

  firstOrderOnly: false,
  newUserOnly: false,
  stackable: false,

  isActive: true,
};

function toNumber(value: string) {
  if (value.trim() === "") return null;

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function csvToList(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function listToCsv(values: string[]) {
  return values
    .map((v) => v.trim())
    .filter(Boolean)
    .join(", ");
}

function hydrateForm(
  coupon?: Coupon | null
): CouponFormState {
  if (!coupon) return EMPTY_FORM;

  return {
    code: coupon.code || "",
    title: coupon.title || "",
    description: coupon.description || "",

    discountType:
      coupon.discountType || "PERCENTAGE",

    discountValue:
      coupon.discountValue === null ||
      coupon.discountValue === undefined
        ? ""
        : String(coupon.discountValue),

    maxDiscount:
      coupon.maxDiscount === null ||
      coupon.maxDiscount === undefined
        ? ""
        : String(coupon.maxDiscount),

    minimumOrderValue:
      coupon.minimumOrderValue === null ||
      coupon.minimumOrderValue === undefined
        ? ""
        : String(coupon.minimumOrderValue),

    applicableRestaurants: listToCsv(
      (coupon.applicableRestaurants || []).map(
        (item: any) =>
          typeof item === "string"
            ? item
            : item?._id ||
              item?.name ||
              ""
      )
    ),

    applicableCuisines:
      (coupon.applicableCuisines || []).join(
        ", "
      ),

    validFrom: coupon.validFrom
      ? new Date(coupon.validFrom)
          .toISOString()
          .slice(0, 16)
      : "",

    validTill: coupon.validTill
      ? new Date(coupon.validTill)
          .toISOString()
          .slice(0, 16)
      : "",

    usageLimit:
      coupon.usageLimit === null ||
      coupon.usageLimit === undefined
        ? ""
        : String(coupon.usageLimit),

    usagePerUserLimit:
      coupon.usagePerUserLimit === null ||
      coupon.usagePerUserLimit === undefined
        ? "1"
        : String(coupon.usagePerUserLimit),

    firstOrderOnly: Boolean(
      coupon.firstOrderOnly
    ),

    newUserOnly: Boolean(
      coupon.newUserOnly
    ),

    stackable: Boolean(
      coupon.stackable
    ),

    isActive: coupon.isActive !== false,
  };
}

function buildPayload(form: CouponFormState): CouponPayload {
  const rewardType: "percentage" | "flat" | "free_delivery" =
    form.discountType === "PERCENTAGE"
      ? "percentage"
      : form.discountType === "FLAT"
        ? "flat"
        : "free_delivery";

  return {
    code: form.code.trim().toUpperCase(),
    title: form.title.trim(),
    description: form.description.trim(),
    type: "coupon",
    isActive: form.isActive,

    validity: {
      start_date: form.validFrom || null,
      end_date: form.validTill || null,
    },

    targeting: {
      restaurants: csvToList(form.applicableRestaurants),
      cuisines: csvToList(form.applicableCuisines),
    },

    conditions: {
      minimum_order_value: toNumber(form.minimumOrderValue),
      first_order_only: form.firstOrderOnly,
      new_user_only: form.newUserOnly,
    },

    reward: {
      type: rewardType,
      value:
        rewardType === "free_delivery"
          ? 0
          : toNumber(form.discountValue) ?? 0,
      max_discount:
        rewardType === "percentage"
          ? toNumber(form.maxDiscount)
          : null,
    },

    limits: {
      total_usage_limit: toNumber(form.usageLimit),
      usage_per_user: toNumber(form.usagePerUserLimit) ?? 1,
    },

    stacking: {
      can_combine: form.stackable,
      excludes: [],
    },
  };
}
export default function CouponForm({
  mode,
  initialData,
  loading = false,
  onSubmit,
  onCancel,
}: CouponFormProps) {
  const [form, setForm] =
    useState<CouponFormState>(
      EMPTY_FORM
    );

  const [error, setError] =
    useState("");

  useEffect(() => {
    setForm(hydrateForm(initialData));
  }, [initialData]);

  const payload = useMemo(
    () => buildPayload(form),
    [form]
  );

const validate = () => {
  if (!payload.code) {
    return "Coupon code is required.";
  }

  if (
    payload.reward.type !== "free_delivery" &&
    payload.reward.value === null
  ) {
    return "Discount value is required.";
  }

  if (
    payload.reward.type === "percentage" &&
    payload.reward.value > 100
  ) {
    return "Percentage discount cannot exceed 100%.";
  }

  if (payload.reward.value < 0) {
    return "Discount value cannot be negative.";
  }

  if (
    payload.reward.max_discount !== null &&
    payload.reward.max_discount < 0
  ) {
    return "Max discount cannot be negative.";
  }

  if (
    payload.conditions.minimum_order_value !== null &&
    payload.conditions.minimum_order_value < 0
  ) {
    return "Minimum order value cannot be negative.";
  }

  if (
    payload.limits.total_usage_limit !== null &&
    payload.limits.total_usage_limit < 0
  ) {
    return "Usage limit cannot be negative.";
  }

  if (
    payload.limits.usage_per_user < 1
  ) {
    return "Usage per user must be at least 1.";
  }

  if (
    payload.validity.start_date &&
    payload.validity.end_date &&
    new Date(payload.validity.end_date).getTime() <
      new Date(payload.validity.start_date).getTime()
  ) {
    return "Valid till date must be after valid from date.";
  }

  return null;
};



  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      await onSubmit(payload);
    } catch (err: any) {
      setError(
        err?.response?.data
          ?.message ||
          err?.message ||
          "Failed to save coupon."
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            {/* {title} */}
            {mode === "edit"
  ? "Edit Coupon"
  : "Create Coupon"}
          </h2>

          <p className="mt-1 text-sm text-zinc-600">
            Configure discount
            rules, restrictions,
            usage limits, and
            validity windows.
          </p>
        </div>

        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Close
          </button>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Coupon code">
          <input
            value={form.code}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                code: e.target.value.toUpperCase(),
              }))
            }
            placeholder="SAVE200"
            required
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          />
        </Field>

        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                title:
                  e.target.value,
              }))
            }
            placeholder="Summer special offer"
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          />
        </Field>

        <Field label="Discount type">
          <select
            value={
              form.discountType
            }
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                discountType:
                  e.target
                    .value as DiscountType,
              }))
            }
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          >
            <option value="PERCENTAGE">
              Percentage
            </option>

            <option value="FLAT">
              Flat
            </option>

            <option value="FREE_DELIVERY">
              Free delivery
            </option>
          </select>
        </Field>

        {form.discountType !==
        "FREE_DELIVERY" ? (
          <Field label="Discount value">
            <input
              value={
                form.discountValue
              }
              onChange={(e) =>
                setForm(
                  (prev) => ({
                    ...prev,
                    discountValue:
                      e.target
                        .value,
                  })
                )
              }
              type="number"
              min="0"
              step="0.01"
              placeholder={
                form.discountType ===
                "PERCENTAGE"
                  ? "20"
                  : "200"
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>
        ) : null}

        {form.discountType ===
        "PERCENTAGE" ? (
          <Field label="Max discount">
            <input
              value={
                form.maxDiscount
              }
              onChange={(e) =>
                setForm(
                  (prev) => ({
                    ...prev,
                    maxDiscount:
                      e.target
                        .value,
                  })
                )
              }
              type="number"
              min="0"
              step="0.01"
              placeholder="500"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>
        ) : null}

        <Field label="Minimum order value">
          <input
            value={
              form.minimumOrderValue
            }
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                minimumOrderValue:
                  e.target.value,
              }))
            }
            type="number"
            min="0"
            step="0.01"
            placeholder="999"
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          />
        </Field>

        <Field label="Usage limit">
          <input
            value={
              form.usageLimit
            }
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                usageLimit:
                  e.target.value,
              }))
            }
            type="number"
            min="0"
            step="1"
            placeholder="1000"
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          />
        </Field>

        <Field label="Usage per user">
          <input
            value={
              form.usagePerUserLimit
            }
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                usagePerUserLimit:
                  e.target.value,
              }))
            }
            type="number"
            min="1"
            step="1"
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          />
        </Field>

        <Field label="Valid from">
          <input
            value={
              form.validFrom
            }
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                validFrom:
                  e.target.value,
              }))
            }
            type="datetime-local"
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          />
        </Field>

        <Field label="Valid till">
          <input
            value={
              form.validTill
            }
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                validTill:
                  e.target.value,
              }))
            }
            type="datetime-local"
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          />
        </Field>

        <Field label="Applicable restaurants">
          <input
            value={
              form.applicableRestaurants
            }
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                applicableRestaurants:
                  e.target.value,
              }))
            }
            placeholder="r1, r2, r3"
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          />
        </Field>

        <Field label="Applicable cuisines">
          <input
            value={
              form.applicableCuisines
            }
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                applicableCuisines:
                  e.target.value,
              }))
            }
            placeholder="Indian, Italian"
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Description">
            <textarea
              rows={4}
              value={
                form.description
              }
              onChange={(e) =>
                setForm(
                  (prev) => ({
                    ...prev,
                    description:
                      e.target
                        .value,
                  })
                )
              }
              placeholder="Optional admin description..."
              className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>
        </div>

        <div className="md:col-span-2 grid gap-3 md:grid-cols-4">
          <CheckField
            label="Active"
            checked={
              form.isActive
            }
            onChange={(
              checked
            ) =>
              setForm(
                (prev) => ({
                  ...prev,
                  isActive:
                    checked,
                })
              )
            }
          />

          <CheckField
            label="First order only"
            checked={
              form.firstOrderOnly
            }
            onChange={(
              checked
            ) =>
              setForm(
                (prev) => ({
                  ...prev,
                  firstOrderOnly:
                    checked,
                })
              )
            }
          />

          <CheckField
            label="New user only"
            checked={
              form.newUserOnly
            }
            onChange={(
              checked
            ) =>
              setForm(
                (prev) => ({
                  ...prev,
                  newUserOnly:
                    checked,
                })
              )
            }
          />

          <CheckField
            label="Stackable"
            checked={
              form.stackable
            }
            onChange={(
              checked
            ) =>
              setForm(
                (prev) => ({
                  ...prev,
                  stackable:
                    checked,
                })
              )
            }
          />
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-8 flex items-center justify-end gap-3">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancel
          </button>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Saving..."
            : mode === "edit"
            ? "Update Coupon"
            : "Create Coupon"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-zinc-700">
        {label}
      </span>

      {children}
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(
            e.target.checked
          )
        }
        className="h-4 w-4 rounded border-zinc-300"
      />

      <span>{label}</span>
    </label>
  );
}