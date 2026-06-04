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

interface FilteredCouponsData {
  totalCount: number;
  activeCount: number;
  totalRedeemed: number;
  totalUsageLimit: number;
}

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

function getStatusBadgeColor(
  coupon: Coupon
): {
  bg: string;
  text: string;
  label: string;
} {
  const now = Date.now();

  const from = coupon.validity?.start_date
    ? new Date(
        coupon.validity.start_date
      ).getTime()
    : null;

  const till = coupon.validity?.end_date
    ? new Date(
        coupon.validity.end_date
      ).getTime()
    : null;

  const scheduled =
    from !== null && from > now;

  const expired =
    till !== null && till < now;

  const usageLimit =
    coupon.limits?.total_usage_limit ||
    0;

  const usedCount =
    coupon.limits?.current_usage_count ||
    0;

  const exhausted =
    usageLimit > 0 &&
    usedCount >= usageLimit;

  const active =
    Boolean(coupon.is_active) &&
    !scheduled &&
    !expired &&
    !exhausted;

  if (active) {
    return {
      bg: "#E6F1FB",
      text: "#185FA5",
      label: "Active",
    };
  }

  if (scheduled) {
    return {
      bg: "#FAEEDA",
      text: "#854F0B",
      label: "Scheduled",
    };
  }

  if (expired) {
    return {
      bg: "#FCEBEB",
      text: "#A32D2D",
      label: "Expired",
    };
  }

  if (exhausted) {
    return {
      bg: "#F1EFE8",
      text: "#5F5E5A",
      label: "Exhausted",
    };
  }

  return {
    bg: "#F1EFE8",
    text: "#5F5E5A",
    label: "Inactive",
  };
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

  const stats: FilteredCouponsData =
    useMemo(() => {
      const totalRedeemed =
        coupons.reduce(
          (acc, item) =>
            acc +
            (item.limits
              ?.current_usage_count ||
              0),
          0
        );

      const totalUsageLimit =
        coupons.reduce(
          (acc, item) =>
            acc +
            (item.limits
              ?.total_usage_limit ||
              0),
          0
        );

      const activeCount = coupons.filter(
        (coupon) =>
          coupon.is_active
      ).length;

      return {
        totalCount: coupons.length,
        activeCount,
        totalRedeemed,
        totalUsageLimit,
      };
    }, [coupons]);

  const toggleCoupon = (
    coupon: Coupon
  ) => {
    setSaving(true);
    setError("");

    api
      .patch(
        `/admin/coupons/${coupon._id}/toggle`
      )
      .then(() => {
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
      })
      .catch((err: any) => {
        console.error(
          "[CouponsPage] toggle:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            "Failed to toggle coupon."
        );
      })
      .finally(() => {
        setSaving(false);
      });
  };

  const deleteCoupon = (
    coupon: Coupon
  ) => {
    const confirmed =
      window.confirm(
        `Delete coupon "${coupon.code}"?`
      );

    if (!confirmed)
      return;

    setSaving(true);
    setError("");

    api
      .delete(
        `/admin/coupons/${coupon._id}`
      )
      .then(() => {
        setCoupons((prev) =>
          prev.filter(
            (item) =>
              item._id !==
              coupon._id
          )
        );
      })
      .catch((err: any) => {
        console.error(
          "[CouponsPage] delete:",
          err
        );

        setError(
          err?.response?.data
            ?.message ||
            "Failed to delete coupon."
        );
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "1.5rem 0",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "13px",
              color: "#888780",
              margin: "0 0 0.5rem",
              fontWeight: "500",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            Admin / Promotions
          </p>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "500",
              margin: "0 0 0.5rem",
              color: "#1a1a1a",
            }}
          >
            Coupons
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#666666",
              margin: "0.5rem 0 0",
            }}
          >
            Manage coupon campaigns,
            restrictions, and usage.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            router.push("/coupons/new")
          }
          style={{
            backgroundColor: "#1a1a1a",
            color: "#ffffff",
            border: "none",
            padding: "0.6rem 1.2rem",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            transition: "background 0.2s",
            whiteSpace: "nowrap",
            height: "fit-content",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement)
              .style.backgroundColor =
              "#333333";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement)
              .style.backgroundColor =
              "#1a1a1a";
          }}
        >
          + New Coupon
        </button>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          marginBottom: "2rem",
        }}
      >
        <StatCard
          label="Total coupons"
          value={stats.totalCount.toString()}
          hint="All campaigns"
        />
        <StatCard
          label="Active now"
          value={stats.activeCount.toString()}
          hint="Running campaigns"
        />
        <StatCard
          label="Total redeemed"
          value={stats.totalRedeemed.toString()}
          hint="Across all codes"
        />
        <StatCard
          label="Capacity used"
          value={
            stats.totalUsageLimit > 0
              ? `${Math.round(
                  (stats.totalRedeemed /
                    stats.totalUsageLimit) *
                    100
                )}%`
              : "0%"
          }
          hint="Of limits"
        />
      </div>

      {/* Filters */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "0.5px solid #d3d1c7",
          borderRadius: "10px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search by coupon code, title..."
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            style={{
              flex: "1",
              minWidth: "200px",
              padding: "0.6rem 0.9rem",
              border: "0.5px solid #d3d1c7",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "#ffffff",
              color: "#1a1a1a",
              fontFamily:
                "system-ui, -apple-system, sans-serif",
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as typeof statusFilter
              )
            }
            style={{
              minWidth: "140px",
              padding: "0.6rem 0.9rem",
              border: "0.5px solid #d3d1c7",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "#ffffff",
              color: "#1a1a1a",
              fontFamily:
                "system-ui, -apple-system, sans-serif",
              cursor: "pointer",
            }}
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
                e.target.value as typeof typeFilter
              )
            }
            style={{
              minWidth: "140px",
              padding: "0.6rem 0.9rem",
              border: "0.5px solid #d3d1c7",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "#ffffff",
              color: "#1a1a1a",
              fontFamily:
                "system-ui, -apple-system, sans-serif",
              cursor: "pointer",
            }}
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
          <div
            style={{
              marginTop: "1rem",
              borderRadius: "8px",
              border:
                "0.5px solid #F7C1C1",
              backgroundColor: "#FCEBEB",
              padding: "0.75rem",
              fontSize: "14px",
              color: "#A32D2D",
            }}
          >
            {error}
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "0.5px solid #d3d1c7",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              fontSize: "14px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom:
                    "0.5px solid #d3d1c7",
                  backgroundColor: "#f8f8f7",
                }}
              >
                {[
                  "Code",
                  "Title",
                  "Discount",
                  "Redeemed",
                  "Status",
                  "Actions",
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      textAlign: "left",
                      padding: "0.75rem 1rem",
                      fontWeight: "500",
                      color: "#888780",
                      fontSize: "12px",
                      textTransform:
                        "uppercase",
                      letterSpacing:
                        "0.5px",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({
                  length: 6,
                }).map((_, idx) => (
                  <tr
                    key={idx}
                    style={{
                      borderBottom:
                        "0.5px solid #e8e8e8",
                    }}
                  >
                    {Array.from({
                      length: 6,
                    }).map(
                      (_, cdIdx) => (
                        <td
                          key={cdIdx}
                          style={{
                            padding: "1rem",
                          }}
                        >
                          <div
                            style={{
                              height: "16px",
                              backgroundColor:
                                "#f0f0f0",
                              borderRadius:
                                "4px",
                              animation:
                                "pulse 2s infinite",
                            }}
                          />
                        </td>
                      )
                    )}
                  </tr>
                ))
              ) : filteredCoupons.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "4rem 1rem",
                      textAlign: "center",
                      fontSize: "14px",
                      color: "#aaaaaa",
                    }}
                  >
                    No coupons found.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map(
                  (coupon) => {
                    const status =
                      getStatusBadgeColor(
                        coupon
                      );

                    return (
                      <tr
                        key={coupon._id}
                        style={{
                          borderBottom:
                            "0.5px solid #e8e8e8",
                          transition:
                            "background 0.2s",
                        }}
                        onMouseEnter={(
                          e
                        ) => {
                          (e.currentTarget
                            .style as any)
                            .backgroundColor =
                            "#fafaf9";
                        }}
                        onMouseLeave={(
                          e
                        ) => {
                          (e.currentTarget
                            .style as any)
                            .backgroundColor =
                            "transparent";
                        }}
                      >
                        <td
                          style={{
                            padding: "1rem",
                            color: "#1a1a1a",
                            fontWeight:
                              "500",
                          }}
                        >
                          <span
                            style={{
                              backgroundColor:
                                "#f8f8f7",
                              padding:
                                "0.4rem 0.6rem",
                              borderRadius:
                                "6px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "600",
                              color: "#444441",
                            }}
                          >
                            {
                              coupon.code
                            }
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "#1a1a1a",
                          }}
                        >
                          {coupon.title ||
                            "Untitled"}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "#1a1a1a",
                            fontWeight:
                              "500",
                          }}
                        >
                          {getDiscountLabel(
                            coupon
                          )}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "#666666",
                          }}
                        >
                          {coupon.limits
                            ?.current_usage_count ||
                            0}{" "}
                          {typeof coupon
                            .limits
                            ?.total_usage_limit ===
                            "number" &&
                          coupon.limits
                            ?.total_usage_limit >
                            0
                            ? `/ ${coupon.limits.total_usage_limit}`
                            : ""}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                          }}
                        >
                          <span
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "0.3rem 0.6rem",
                              borderRadius:
                                "6px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "500",
                              backgroundColor:
                                status.bg,
                              color:
                                status.text,
                            }}
                          >
                            {
                              status.label
                            }
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            textAlign:
                              "right",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/coupons/${coupon._id}/edit`
                              )
                            }
                            style={{
                              backgroundColor:
                                "transparent",
                              border:
                                "0.5px solid #b4b2a9",
                              color: "#1a1a1a",
                              padding:
                                "0.35rem 0.7rem",
                              borderRadius:
                                "6px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "500",
                              cursor:
                                "pointer",
                              marginLeft:
                                "6px",
                              transition:
                                "all 0.2s",
                            }}
                            onMouseEnter={(
                              e
                            ) => {
                              (e.target as HTMLButtonElement)
                                .style
                                .backgroundColor =
                                "#f8f8f7";
                            }}
                            onMouseLeave={(
                              e
                            ) => {
                              (e.target as HTMLButtonElement)
                                .style
                                .backgroundColor =
                                "transparent";
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              toggleCoupon(
                                coupon
                              )
                            }
                            style={{
                              backgroundColor:
                                "transparent",
                              border:
                                "0.5px solid #b4b2a9",
                              color: "#1a1a1a",
                              padding:
                                "0.35rem 0.7rem",
                              borderRadius:
                                "6px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "500",
                              cursor: saving
                                ? "not-allowed"
                                : "pointer",
                              marginLeft:
                                "6px",
                              transition:
                                "all 0.2s",
                              opacity: saving
                                ? 0.6
                                : 1,
                            }}
                            onMouseEnter={(
                              e
                            ) => {
                              if (!saving) {
                                (e.target as HTMLButtonElement)
                                  .style
                                  .backgroundColor =
                                  "#f8f8f7";
                              }
                            }}
                            onMouseLeave={(
                              e
                            ) => {
                              (e.target as HTMLButtonElement)
                                .style
                                .backgroundColor =
                                "transparent";
                            }}
                          >
                            {coupon.is_active
                              ? "Disable"
                              : "Enable"}
                          </button>
                          <button
                            type="button"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              deleteCoupon(
                                coupon
                              )
                            }
                            style={{
                              backgroundColor:
                                "transparent",
                              border:
                                "0.5px solid #F7C1C1",
                              color: "#A32D2D",
                              padding:
                                "0.35rem 0.7rem",
                              borderRadius:
                                "6px",
                              fontSize:
                                "12px",
                              fontWeight:
                                "500",
                              cursor: saving
                                ? "not-allowed"
                                : "pointer",
                              marginLeft:
                                "6px",
                              transition:
                                "all 0.2s",
                              opacity: saving
                                ? 0.6
                                : 1,
                            }}
                            onMouseEnter={(
                              e
                            ) => {
                              if (!saving) {
                                (e.target as HTMLButtonElement)
                                  .style
                                  .backgroundColor =
                                  "#FCEBEB";
                              }
                            }}
                            onMouseLeave={(
                              e
                            ) => {
                              (e.target as HTMLButtonElement)
                                .style
                                .backgroundColor =
                                "transparent";
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#f8f8f7",
        padding: "1rem",
        borderRadius: "10px",
        border: "0.5px solid #d3d1c7",
      }}
    >
      <p
        style={{
          fontSize: "12px",
          color: "#888780",
          fontWeight: "500",
          margin: "0 0 0.75rem",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "28px",
          fontWeight: "500",
          margin: "0",
          color: "#1a1a1a",
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: "12px",
          color: "#aaaaaa",
          margin: "0.5rem 0 0",
        }}
      >
        {hint}
      </p>
    </div>
  );
}