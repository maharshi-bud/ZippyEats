"use client";

import CouponStatusBadge from "./CouponStatusBadge";

interface CouponUsageCardProps {
  code: string;

  usedCount?: number | null;
  usageLimit?: number | null;

  usagePerUserLimit?: number | null;

  isActive?: boolean;

  validFrom?: string | Date | null;
  validTill?: string | Date | null;

  totalSavingsGiven?: number | null;

  className?: string;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatNumber(value?: number | null) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "0";
  }

  return Number(value).toLocaleString("en-IN");
}

function formatCurrency(value?: number | null) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "₹0";
  }

  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function getUsagePercentage(
  used?: number | null,
  limit?: number | null
) {
  if (
    typeof limit !== "number" ||
    limit <= 0
  ) {
    return 0;
  }

  if (
    typeof used !== "number" ||
    used <= 0
  ) {
    return 0;
  }

  return Math.min(
    (used / limit) * 100,
    100
  );
}

export default function CouponUsageCard({
  code,

  usedCount = 0,
  usageLimit = null,

  usagePerUserLimit = 1,

  isActive = false,

  validFrom,
  validTill,

  totalSavingsGiven = 0,

  className,
}: CouponUsageCardProps) {
  const usagePercentage =
    getUsagePercentage(
      usedCount,
      usageLimit
    );

  const unlimited =
    typeof usageLimit !== "number" ||
    usageLimit <= 0;

  return (
    <div
      className={cn(
        "rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Coupon Usage
          </p>

          <h3 className="mt-1 text-2xl font-semibold text-zinc-900">
            {code}
          </h3>
        </div>

        <CouponStatusBadge
          isActive={isActive}
          validFrom={validFrom}
          validTill={validTill}
          usageLimit={usageLimit}
          usedCount={usedCount}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatBlock
          label="Total Usage"
          value={formatNumber(
            usedCount
          )}
        />

        <StatBlock
          label="Usage Limit"
          value={
            unlimited
              ? "Unlimited"
              : formatNumber(
                  usageLimit
                )
          }
        />

        <StatBlock
          label="Per User"
          value={formatNumber(
            usagePerUserLimit
          )}
        />
      </div>

      {!unlimited ? (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-zinc-700">
              Usage Progress
            </span>

            <span className="text-zinc-500">
              {usagePercentage.toFixed(
                0
              )}
              %
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",

                usagePercentage >= 90
                  ? "bg-rose-500"
                  : usagePercentage >= 70
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              )}
              style={{
                width: `${usagePercentage}%`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Used{" "}
              {formatNumber(
                usedCount
              )}
            </span>

            <span>
              Remaining{" "}
              {formatNumber(
                Math.max(
                  (usageLimit || 0) -
                    (usedCount || 0),
                  0
                )
              )}
            </span>
          </div>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-600">
              Total Savings Given
            </p>

            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {formatCurrency(
                totalSavingsGiven
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Avg / Redemption
            </p>

            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {usedCount > 0
                ? formatCurrency(
                    Number(
                      totalSavingsGiven
                    ) / usedCount
                  )
                : "₹0"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
      <p className="text-sm text-zinc-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-zinc-900">
        {value}
      </p>
    </div>
  );
}