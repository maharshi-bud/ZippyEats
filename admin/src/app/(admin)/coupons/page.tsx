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
      bg: "#dcfce7",
      text: "#166534",
      label: "Active",
      dot: "#10b981",
    };
  }

  if (scheduled) {
    return {
      bg: "#fef3c7",
      text: "#92400e",
      label: "Scheduled",
      dot: "#f59e0b",
    };
  }

  if (expired) {
    return {
      bg: "#fee2e2",
      text: "#991b1b",
      label: "Expired",
      dot: "#ef4444",
    };
  }

  if (exhausted) {
    return {
      bg: "#f3f4f6",
      text: "#374151",
      label: "Exhausted",
      dot: "#6b7280",
    };
  }

  return {
    bg: "#f3f4f6",
    text: "#374151",
    label: "Inactive",
    dot: "#6b7280",
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
        maxWidth: "1600px",
        margin: "0 auto",
        padding: "2rem 1rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              margin: "0 0 0.5rem",
              color: "#1a1a1a",
            }}
          >
            Promotion Center
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "#666666",
              margin: "0",
            }}
          >
            Create, manage and track campaigns
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
            padding: "0.65rem 1.5rem",
            borderRadius: "10px",
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

      {/* Improvement #7: Top Summary Bar */}
      <div
        style={{
          marginBottom: "2rem",
          padding: "1rem",
          backgroundColor: "#f8fafc",
          borderRadius: "10px",
          fontSize: "14px",
          color: "#6b7280",
        }}
      >
        <span style={{ fontWeight: "500", color: "#1a1a1a" }}>
          {stats.totalCount}
        </span>
        {" Coupons • "}
        <span style={{ fontWeight: "500", color: "#1a1a1a" }}>
          {stats.activeCount}
        </span>
        {" Active • "}
        <span style={{ fontWeight: "500", color: "#1a1a1a" }}>
          {stats.totalRedeemed}
        </span>
        {" Redeemed • Last Updated 2 min ago"}
      </div>

      {/* Stats Grid - Compact */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "2rem",
        }}
      >
        {/* Improvement #2: Colored Left Border */}
        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderLeft: "4px solid #3b82f6",
            borderRadius: "10px",
            padding: "1rem",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            style={{
              marginBottom: "0.75rem",
            }}
          >
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M18
           3h-2v4h2V3zM10 3H8v4h2V3z"></path>
          </svg>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#1a1a1a",
            }}
          >
            {stats.totalCount}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "0.25rem",
            }}
          >
            Coupons
          </div>
          {/* Improvement #1: Secondary Line */}
          <div
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              marginTop: "0.5rem",
            }}
          >
            +4 this month
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderLeft: "4px solid #10b981",
            borderRadius: "10px",
            padding: "1rem",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            style={{
              marginBottom: "0.75rem",
            }}
          >
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#1a1a1a",
            }}
          >
            {stats.activeCount}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "0.25rem",
            }}
          >
            Active
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              marginTop: "0.5rem",
            }}
          >
            100% live
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderLeft: "4px solid #f97316",
            borderRadius: "10px",
            padding: "1rem",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            style={{
              marginBottom: "0.75rem",
            }}
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#1a1a1a",
            }}
          >
            {stats.totalRedeemed}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "0.25rem",
            }}
          >
            Used
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              marginTop: "0.5rem",
            }}
          >
            Across all campaigns
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderLeft: "4px solid #6366f1",
            borderRadius: "10px",
            padding: "1rem",
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            style={{
              marginBottom: "0.75rem",
            }}
          >
            <polyline points="23 6 13.5 15.5 8 9.5 1 16"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#1a1a1a",
            }}
          >
            {stats.totalUsageLimit > 0
              ? `${Math.round(
                  (stats.totalRedeemed /
                    stats.totalUsageLimit) *
                    100
                )}%`
              : "0%"}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "0.25rem",
            }}
          >
            Capacity
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              marginTop: "0.5rem",
            }}
          >
            {stats.totalRedeemed} / {stats.totalUsageLimit}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Improvement #9: Search Bar Icon */}
          <div
            style={{
              flex: "1",
              minWidth: "250px",
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              style={{
                position: "absolute",
                left: "12px",
                pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search coupons, codes, titles..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 40px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                backgroundColor: "#ffffff",
                color: "#1a1a1a",
                fontFamily:
                  "system-ui, -apple-system, sans-serif",
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as typeof statusFilter
              )
            }
            style={{
              padding: "0.75rem 1rem",
              border: "1px solid #e5e7eb",
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
              All Status
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
              padding: "0.75rem 1rem",
              border: "1px solid #e5e7eb",
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
              Flat Amount
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
              border: "1px solid #fee2e2",
              backgroundColor: "#fef2f2",
              padding: "0.75rem 1rem",
              fontSize: "14px",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        ) : null}
      </div>

      {/* Coupons List - Table Style */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "2rem" }}>
            {Array.from({
              length: 6,
            }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  height: "70px",
                  backgroundColor:
                    "#f9fafb",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  animation:
                    "pulse 2s infinite",
                }}
              />
            ))}
          </div>
        ) : filteredCoupons.length ===
          0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 1rem",
            }}
          >
            <p
              style={{
                fontSize: "16px",
                color: "#6b7280",
                margin: "0",
              }}
            >
              No coupons found
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#9ca3af",
                margin: "0.5rem 0 0",
              }}
            >
              Try adjusting your search or
              filters
            </p>
          </div>
        ) : (
          <div>
            {filteredCoupons.map(
              (coupon, idx) => {
                const status =
                  getStatusBadgeColor(
                    coupon
                  );
                const usedCount =
                  coupon.limits
                    ?.current_usage_count ||
                  0;
                const usageLimit =
                  coupon.limits
                    ?.total_usage_limit || 0;

                return (
                  <div
                    key={coupon._id}
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      padding:
                        "1rem 1.5rem",
                      borderBottom:
                        idx ===
                        filteredCoupons.length -
                          1
                          ? "none"
                          : "1px solid #f3f4f6",
                      /* Improvement #3: Hover transition */
                      transition:
                        "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget
                        .style as any)
                        .backgroundColor =
                        "#f8fafc";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget
                        .style as any)
                        .backgroundColor =
                        "transparent";
                    }}
                  >
                    {/* Left: Code, Title, Description */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {/* Improvement #4: Better Coupon Code */}
                      <div
                        style={{
                          display:
                            "inline-block",
                          fontFamily:
                            "monospace",
                          fontSize:
                            "12px",
                          fontWeight:
                            "700",
                          backgroundColor:
                            "#eef2ff",
                          color:
                            "#4338ca",
                          padding:
                            "0.35rem 0.6rem",
                          borderRadius:
                            "4px",
                          marginRight:
                            "0.75rem",
                        }}
                      >
                        {coupon.code}
                      </div>
                      <span
                        style={{
                          fontSize:
                            "14px",
                          fontWeight:
                            "600",
                          color:
                            "#1a1a1a",
                        }}
                      >
                        {coupon.title ||
                          "Untitled Coupon"}
                      </span>
                      {coupon.description && (
                        <p
                          style={{
                            fontSize:
                              "12px",
                            color:
                              "#6b7280",
                            margin:
                              "0.25rem 0 0",
                          }}
                        >
                          {
                            coupon.description
                          }
                        </p>
                      )}
                    </div>

                    {/* Middle: Discount */}
                    <div
                      style={{
                        textAlign:
                          "center",
                        marginRight:
                          "2rem",
                        minWidth:
                          "100px",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "15px",
                          fontWeight:
                            "700",
                          color:
                            "#1a1a1a",
                        }}
                      >
                        {getDiscountLabel(
                          coupon
                        )}
                      </div>
                    </div>

                    {/* Redeemed Count */}
                    <div
                      style={{
                        textAlign:
                          "center",
                        marginRight:
                          "2rem",
                        minWidth:
                          "100px",
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            "12px",
                          color:
                            "#6b7280",
                          marginBottom:
                            "0.25rem",
                        }}
                      >
                        Redeemed
                      </div>
                      <div
                        style={{
                          fontSize:
                            "14px",
                          fontWeight:
                            "600",
                          color:
                            "#1a1a1a",
                        }}
                      >
                        {usedCount}
                        {usageLimit > 0
                          ? ` / ${usageLimit}`
                          : " / ∞"}
                      </div>
                    </div>

                    {/* Status Badge - Improvement #5: With Dot */}
                    <div
                      style={{
                        marginRight:
                          "2rem",
                        minWidth:
                          "100px",
                        textAlign:
                          "center",
                      }}
                    >
                      <span
                        style={{
                          display:
                            "inline-flex",
                          alignItems:
                            "center",
                          gap: "6px",
                          padding:
                            "0.35rem 0.75rem",
                          borderRadius:
                            "6px",
                          fontSize:
                            "12px",
                          fontWeight:
                            "600",
                          backgroundColor:
                            status.bg,
                          color:
                            status.text,
                        }}
                      >
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius:
                              "50%",
                            backgroundColor:
                              status.dot,
                          }}
                        />
                        {status.label}
                      </span>
                    </div>

                    {/* Actions - Improvement #10: Text Labels Instead of Icons */}
                    <div
                      style={{
                        display:
                          "flex",
                        gap: "6px",
                        flexShrink: 0,
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
                          padding:
                            "0.5rem 1rem",
                          backgroundColor:
                            "#ffffff",
                          border:
                            "1px solid #d1d5db",
                          borderRadius:
                            "6px",
                          color:
                            "#374151",
                          fontSize:
                            "12px",
                          fontWeight:
                            "500",
                          cursor:
                            "pointer",
                          transition:
                            "all 0.2s",
                        }}
                        onMouseEnter={(
                          e
                        ) => {
                          (e.target as HTMLButtonElement)
                            .style
                            .backgroundColor =
                            "#f3f4f6";
                          (e.target as HTMLButtonElement)
                            .style
                            .borderColor =
                            "#9ca3af";
                        }}
                        onMouseLeave={(
                          e
                        ) => {
                          (e.target as HTMLButtonElement)
                            .style
                            .backgroundColor =
                            "#ffffff";
                          (e.target as HTMLButtonElement)
                            .style
                            .borderColor =
                            "#d1d5db";
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
                          padding:
                            "0.5rem 1rem",
                          backgroundColor:
                            coupon.is_active
                              ? "#dcfce7"
                              : "#fee2e2",
                          border:
                            coupon.is_active
                              ? "1px solid #86efac"
                              : "1px solid #fca5a5",
                          borderRadius:
                            "6px",
                          color:
                            coupon.is_active
                              ? "#166534"
                              : "#991b1b",
                          fontSize:
                            "12px",
                          fontWeight:
                            "600",
                          cursor:
                            saving
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            saving
                              ? 0.6
                              : 1,
                          transition:
                            "all 0.2s",
                        }}
                        onMouseEnter={(
                          e
                        ) => {
                          if (!saving) {
                            (e.target as HTMLButtonElement)
                              .style
                              .opacity = "0.8";
                          }
                        }}
                        onMouseLeave={(
                          e
                        ) => {
                          (e.target as HTMLButtonElement)
                            .style
                            .opacity = "1";
                        }}
                      >
                        {coupon.is_active
                          ? "ON"
                          : "OFF"}
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
                          padding:
                            "0.5rem 1rem",
                          backgroundColor:
                            "#ffffff",
                          border:
                            "1px solid #fee2e2",
                          borderRadius:
                            "6px",
                          color:
                            "#dc2626",
                          fontSize:
                            "12px",
                          fontWeight:
                            "500",
                          cursor:
                            saving
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            saving
                              ? 0.6
                              : 1,
                          transition:
                            "all 0.2s",
                        }}
                        onMouseEnter={(
                          e
                        ) => {
                          if (!saving) {
                            (e.target as HTMLButtonElement)
                              .style
                              .backgroundColor =
                              "#fef2f2";
                          }
                        }}
                        onMouseLeave={(
                          e
                        ) => {
                          (e.target as HTMLButtonElement)
                            .style
                            .backgroundColor =
                            "#ffffff";
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
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