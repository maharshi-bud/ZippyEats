"use client";

export type CouponStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "EXPIRED"
  | "SCHEDULED"
  | "EXHAUSTED";

export interface CouponStatusBadgeProps {
  isActive?: boolean;
  validFrom?: string | Date | null;
  validTill?: string | Date | null;

  usageLimit?: number | null;
  usedCount?: number | null;

  className?: string;

  size?: "sm" | "md";
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function getCouponStatus({
  isActive,
  validFrom,
  validTill,
  usageLimit,
  usedCount,
}: Omit<CouponStatusBadgeProps, "className" | "size">): CouponStatus {
  const now = Date.now();

  const from =
    validFrom
      ? new Date(validFrom).getTime()
      : null;

  const till =
    validTill
      ? new Date(validTill).getTime()
      : null;

  const scheduled =
    from !== null && from > now;

  const expired =
    till !== null && till < now;

  const exhausted =
    typeof usageLimit === "number" &&
    usageLimit > 0 &&
    typeof usedCount === "number" &&
    usedCount >= usageLimit;

  if (expired) {
    return "EXPIRED";
  }

  if (exhausted) {
    return "EXHAUSTED";
  }

  if (scheduled) {
    return "SCHEDULED";
  }

  if (isActive) {
    return "ACTIVE";
  }

  return "INACTIVE";
}

const STATUS_STYLES: Record<
  CouponStatus,
  {
    label: string;
    className: string;
    dotClassName: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    dotClassName:
      "bg-emerald-500",
  },

  INACTIVE: {
    label: "Inactive",
    className:
      "border-zinc-200 bg-zinc-100 text-zinc-700",
    dotClassName:
      "bg-zinc-500",
  },

  EXPIRED: {
    label: "Expired",
    className:
      "border-rose-200 bg-rose-50 text-rose-700",
    dotClassName:
      "bg-rose-500",
  },

  SCHEDULED: {
    label: "Scheduled",
    className:
      "border-sky-200 bg-sky-50 text-sky-700",
    dotClassName:
      "bg-sky-500",
  },

  EXHAUSTED: {
    label: "Exhausted",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    dotClassName:
      "bg-amber-500",
  },
};

export default function CouponStatusBadge({
  isActive = false,
  validFrom,
  validTill,

  usageLimit,
  usedCount,

  className,
  size = "md",
}: CouponStatusBadgeProps) {
  const status = getCouponStatus({
    isActive,
    validFrom,
    validTill,
    usageLimit,
    usedCount,
  });

  const config =
    STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium",

        size === "sm"
          ? "px-2.5 py-1 text-[11px]"
          : "px-3 py-1.5 text-xs",

        config.className,
        className
      )}
    >
      <span
        className={cn(
          "rounded-full",

          size === "sm"
            ? "h-1.5 w-1.5"
            : "h-2 w-2",

          config.dotClassName
        )}
      />

      {config.label}
    </span>
  );
}