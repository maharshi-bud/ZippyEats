"use client";

import CouponStatusBadge from "./CouponStatusBadge";

export type DiscountType =
  | "PERCENTAGE"
  | "FLAT"
  | "FREE_DELIVERY";

export interface Coupon {
  _id: string;

  code: string;

  title?: string;

  description?: string;

  is_active?: boolean;

  reward?: {
    type?:
      | "percentage"
      | "flat"
      | "free_delivery";

    value?: number | null;

    max_discount?:
      | number
      | null;
  };

  validity?: {
    start_date?:
      | string
      | Date
      | null;

    end_date?:
      | string
      | Date
      | null;
  };

  limits?: {
    total_usage_limit?:
      | number
      | null;

    usage_per_user?:
      | number
      | null;

    current_usage_count?:
      | number
      | null;
  };

  visibility?: {
    first_order_only?: boolean;

    new_user_only?: boolean;
  };

  stacking?: {
    can_combine?: boolean;
  };

  conditions?: {
    min_order_amount?:
      | number
      | null;
  };
}

interface CouponTableProps {
  coupons: Coupon[];

  loading?: boolean;

  onEdit?: (
    coupon: Coupon
  ) => void;

  onDelete?: (
    coupon: Coupon
  ) => void;

  onToggle?: (
    coupon: Coupon
  ) => void;

  actionLoading?: boolean;

  emptyMessage?: string;
}

function cn(
  ...classes: Array<
    | string
    | false
    | null
    | undefined
  >
) {
  return classes
    .filter(Boolean)
    .join(" ");
}

function formatCurrency(
  value?: number | null
) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "—";
  }

  return `₹${Number(
    value
  ).toLocaleString("en-IN")}`;
}

function formatDate(
  value?:
    | string
    | Date
    | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(
    value
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getDiscountLabel(
  coupon: Coupon
) {
  if (
    coupon.reward?.type ===
    "percentage"
  ) {
    return `${
      coupon.reward?.value || 0
    }% OFF`;
  }

  if (
    coupon.reward?.type ===
    "flat"
  ) {
    return `${formatCurrency(
      coupon.reward?.value
    )} OFF`;
  }

  return "Free Delivery";
}

export default function CouponTable({
  coupons,

  loading = false,

  onEdit,

  onDelete,

  onToggle,

  actionLoading = false,

  emptyMessage = "No coupons found.",
}: CouponTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-zinc-600">
              <th className="px-5 py-4 font-medium">
                Coupon
              </th>

              <th className="px-5 py-4 font-medium">
                Discount
              </th>

              <th className="px-5 py-4 font-medium">
                Usage
              </th>

              <th className="px-5 py-4 font-medium">
                Validity
              </th>

              <th className="px-5 py-4 font-medium">
                Status
              </th>

              <th className="px-5 py-4 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              Array.from({
                length: 6,
              }).map((_, index) => (
                <SkeletonRow
                  key={index}
                />
              ))
            ) : coupons.length ===
              0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-sm text-zinc-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              coupons.map(
                (coupon) => (
                  <tr
                    key={coupon._id}
                    className="border-b border-zinc-100 transition hover:bg-zinc-50/70"
                  >
                    <td className="px-5 py-5 align-top">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-zinc-100 px-3 py-2 text-xs font-semibold tracking-wide text-zinc-700">
                          {
                            coupon.code
                          }
                        </div>

                        <div>
                          <div className="font-semibold text-zinc-900">
                            {coupon.title ||
                              "Untitled Coupon"}
                          </div>

                          {coupon.description ? (
                            <p className="mt-1 max-w-[320px] text-xs leading-5 text-zinc-500">
                              {
                                coupon.description
                              }
                            </p>
                          ) : null}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {coupon
                              .visibility
                              ?.first_order_only ? (
                              <Tag>
                                First Order
                              </Tag>
                            ) : null}

                            {coupon
                              .visibility
                              ?.new_user_only ? (
                              <Tag>
                                New Users
                              </Tag>
                            ) : null}

                            {coupon
                              .stacking
                              ?.can_combine ? (
                              <Tag>
                                Stackable
                              </Tag>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="font-semibold text-zinc-900">
                        {getDiscountLabel(
                          coupon
                        )}
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-zinc-500">
                        <div>
                          Type:{" "}
                          {
                            coupon
                              .reward
                              ?.type
                          }
                        </div>

                        <div>
                          Min Order:{" "}
                          {formatCurrency(
                            coupon
                              .conditions
                              ?.min_order_amount
                          )}
                        </div>

                        {coupon
                          .reward
                          ?.type ===
                        "percentage" ? (
                          <div>
                            Max Discount:{" "}
                            {formatCurrency(
                              coupon
                                .reward
                                ?.max_discount
                            )}
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="font-semibold text-zinc-900">
                        {coupon
                          .limits
                          ?.current_usage_count ||
                          0}

                        {typeof coupon
                          .limits
                          ?.total_usage_limit ===
                          "number" &&
                        coupon
                          .limits
                          ?.total_usage_limit >
                            0
                          ? ` / ${coupon.limits.total_usage_limit}`
                          : ""}
                      </div>

                      <div className="mt-2 text-xs text-zinc-500">
                        Per user:{" "}
                        {coupon
                          .limits
                          ?.usage_per_user ||
                          1}
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top text-zinc-700">
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium text-zinc-900">
                            From:
                          </span>{" "}
                          {formatDate(
                            coupon
                              .validity
                              ?.start_date
                          )}
                        </div>

                        <div>
                          <span className="font-medium text-zinc-900">
                            Till:
                          </span>{" "}
                          {formatDate(
                            coupon
                              .validity
                              ?.end_date
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-5 align-top">
                      <CouponStatusBadge
                        isActive={
                          coupon.is_active
                        }
                        validFrom={
                          coupon
                            .validity
                            ?.start_date
                        }
                        validTill={
                          coupon
                            .validity
                            ?.end_date
                        }
                        usageLimit={
                          coupon
                            .limits
                            ?.total_usage_limit
                        }
                        usedCount={
                          coupon
                            .limits
                            ?.current_usage_count
                        }
                      />
                    </td>

                    <td className="px-5 py-5 align-top">
                      <div className="flex justify-end gap-2">
                        {onEdit ? (
                          <button
                            type="button"
                            onClick={() =>
                              onEdit(
                                coupon
                              )
                            }
                            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                          >
                            Edit
                          </button>
                        ) : null}

                        {onToggle ? (
                          <button
                            type="button"
                            disabled={
                              actionLoading
                            }
                            onClick={() =>
                              onToggle(
                                coupon
                              )
                            }
                            className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {coupon.is_active
                              ? "Disable"
                              : "Enable"}
                          </button>
                        ) : null}

                        {onDelete ? (
                          <button
                            type="button"
                            disabled={
                              actionLoading
                            }
                            onClick={() =>
                              onDelete(
                                coupon
                              )
                            }
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Delete
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Tag({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
      {children}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-zinc-100">
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <td
          key={index}
          className="px-5 py-5"
        >
          <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
        </td>
      ))}
    </tr>
  );
}