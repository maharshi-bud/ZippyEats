"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

export type DiscountType = "PERCENTAGE" | "FLAT" | "FREE_DELIVERY" |"BXGY";
export type CouponType = "coupon" | "auto_apply" | "reward";
export type PaymentMethod = "UPI" | "CARD" | "WALLET" | "NET_BANKING" | "CASH";
export type Platform = "WEB" | "MOBILE" | "APP";

export type Coupon = {
  _id: string;
  code: string;
  title?: string;
  description?: string;

  type?: CouponType;
  is_active?: boolean;

  // ── VALIDITY ──
  validity?: {
    start_date?: string | Date | null;
    end_date?: string | Date | null;
    timezone?: string;
    days_allowed?: number[]; // 0=Sun, 1=Mon, etc
    time_ranges?: Array<{ start: string; end: string }>;
  };

  // ── TARGETING ──
  targeting?: {
    restaurants?: string[];
    cuisines?: string[];
    cities?: string[];
    user_ids?: string[];
  };

  // ── CONDITIONS ──
  conditions?: {
    min_order_amount?: number | null;
    max_order_amount?: number | null;
    min_items?: number | null;
    first_order?: boolean;
    second_order?: boolean;
    order_number?: { min: number | null; max: number | null };
    min_restaurant_spend?: number | null;
    payment_methods?: PaymentMethod[];
    allowed_platforms?: Platform[];
    requires_items?: Array<{ item_id: string; qty: number }>;
    buy_x_get_y?: {
      buy_item: string;
      buy_qty: number;
      get_item: string;
      get_qty: number;
    };
  };

  // ── REWARD ──
  reward?: {
    type?: "percentage" | "flat" | "free_delivery" | "bxgy";
    value?: number;
    max_discount?: number | null;
    bxgy_reward?: {
      item_id: string;
      qty: number;
    };  
  };

  // ── LIMITS ──
  limits?: {
    total_usage_limit?: number | null;
    current_usage_count?: number | null;
    usage_per_user?: number | null;
  };

  // ── STACKING ──
  stacking?: {
    can_combine?: boolean;
    excludes?: string[];
  };

  analytics?: {
    total_used?: number;
    total_discount_given?: number;
  };

  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type CouponPayload = {
  code: string;
  title: string;
  description: string;

  type: CouponType;
  is_active: boolean;

  validity: {
    start_date: string | null;
    end_date: string | null;
    timezone: string;
    days_allowed: number[];
    time_ranges: Array<{ start: string; end: string }>;
  };

  targeting: {
    restaurants: string[];
    cuisines: string[];
    cities: string[];
    user_ids: string[];
  };

  conditions: {
    min_order_amount: number | null;
    max_order_amount: number | null;
    min_items: number | null;
    first_order: boolean;
    second_order: boolean;
    order_number: { min: number | null; max: number | null };
    min_restaurant_spend: number | null;
    payment_methods: PaymentMethod[];
    allowed_platforms: Platform[];
    requires_items: Array<{ item_id: string; qty: number }>;
    buy_x_get_y: {
      buy_item: string;
      buy_qty: number;
      get_item: string;
      get_qty: number;
    } | null;
  };

  reward: {
    type: "percentage" | "flat" | "free_delivery" | "bxgy";
    value: number;
    max_discount: number | null;
    bxgy_reward: {
      item_id: string;
      qty: number;
    } | null;
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

  couponType: CouponType;
  discountType: DiscountType;

  discountValue: string;
  maxDiscount: string;

  // ── VALIDITY ──
  validFrom: string;
  validTill: string;
  timezone: string;
  daysAllowed: boolean[];
  timeRangesJson: string;

  // ── CONDITIONS ──
  minOrderAmount: string;
  maxOrderAmount: string;
  minItems: string;
  firstOrder: boolean;
  secondOrder: boolean;
  minRestaurantSpend: string;
  paymentMethods: string[];
  allowedPlatforms: string[];
  requiresItemsJson: string;

  // ── TARGETING ──
  applicableRestaurants: string;
  applicableCuisines: string;
  applicableCities: string;
  applicableUserIds: string;

  // ── BUY X GET Y ──
  buyXGetYEnabled: boolean;
  buyXItem: string;
  buyXQty: string;
  getYItem: string;
  getYQty: string;

  // ── LIMITS ──
  usageLimit: string;
  usagePerUserLimit: string;

  isActive: boolean;
  stackable: boolean;
};

interface CouponFormProps {
  mode: "create" | "edit";
  initialData?: Coupon | null;
  loading?: boolean;
  onSubmit: (payload: CouponPayload) => Promise<void>;
  onCancel?: () => void;
}

// ════════════════════════════════════════════════════════════════
// EMPTY FORM STATE
// ════════════════════════════════════════════════════════════════

const EMPTY_FORM: CouponFormState = {
  code: "",
  title: "",
  description: "",

  couponType: "coupon",
  discountType: "PERCENTAGE",

  discountValue: "",
  maxDiscount: "",

  validFrom: "",
  validTill: "",
  timezone: "Asia/Kolkata",
  daysAllowed: [false, false, false, false, false, false, false],
  timeRangesJson: "",

  minOrderAmount: "",
  maxOrderAmount: "",
  minItems: "",
  firstOrder: false,
  secondOrder: false,
  minRestaurantSpend: "",
  paymentMethods: [],
  allowedPlatforms: [],
  requiresItemsJson: "",

  applicableRestaurants: "",
  applicableCuisines: "",
  applicableCities: "",
  applicableUserIds: "",

  buyXGetYEnabled: false,
  buyXItem: "",
  buyXQty: "1",
  getYItem: "",
  getYQty: "1",

  usageLimit: "",
  usagePerUserLimit: "1",

  isActive: true,
  stackable: false,
};

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

function toNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function csvToList(value: string) {
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

function listToCsv(values: string[]) {
  return values.map((v) => v.trim()).filter(Boolean).join(", ");
}

function tryParseJson(json: string, fallback: any = null) {
  try {
    return json.trim() ? JSON.parse(json) : fallback;
  } catch {
    return fallback;
  }
}

function hydrateForm(coupon?: Coupon | null): CouponFormState {
  if (!coupon) return EMPTY_FORM;

  return {
    code: coupon.code || "",
    title: coupon.title || "",
    description: coupon.description || "",

    couponType: coupon.type || "coupon",
    discountType:
  coupon.reward?.type === "percentage"
    ? "PERCENTAGE"
    : coupon.reward?.type === "flat"
      ? "FLAT"
      : coupon.reward?.type === "bxgy"
        ? "BXGY"
        : "FREE_DELIVERY",

    discountValue: String(coupon.reward?.value || ""),
    maxDiscount: String(coupon.reward?.max_discount || ""),

    validFrom: coupon.validity?.start_date
      ? new Date(coupon.validity.start_date).toISOString().slice(0, 16)
      : "",
    validTill: coupon.validity?.end_date
      ? new Date(coupon.validity.end_date).toISOString().slice(0, 16)
      : "",
    timezone: coupon.validity?.timezone || "Asia/Kolkata",
    daysAllowed: Array(7).fill(false).map((_, i) =>
      coupon.validity?.days_allowed?.includes(i) || false
    ),
    timeRangesJson: JSON.stringify(coupon.validity?.time_ranges || []),

    minOrderAmount: String(coupon.conditions?.min_order_amount || ""),
    maxOrderAmount: String(coupon.conditions?.max_order_amount || ""),
    minItems: String(coupon.conditions?.min_items || ""),
    firstOrder: coupon.conditions?.first_order || false,
    secondOrder: coupon.conditions?.second_order || false,
    minRestaurantSpend: String(coupon.conditions?.min_restaurant_spend || ""),
    paymentMethods: coupon.conditions?.payment_methods || [],
    allowedPlatforms: coupon.conditions?.allowed_platforms || [],
    requiresItemsJson: JSON.stringify(coupon.conditions?.requires_items || []),

    applicableRestaurants: listToCsv(coupon.targeting?.restaurants || []),
    applicableCuisines: listToCsv(coupon.targeting?.cuisines || []),
    applicableCities: listToCsv(coupon.targeting?.cities || []),
    applicableUserIds: listToCsv(coupon.targeting?.user_ids || []),

  buyXGetYEnabled: !!coupon.reward?.bxgy_reward,
buyXItem: coupon.conditions?.buy_x_get_y?.buy_item || "",
buyXQty: String(coupon.conditions?.buy_x_get_y?.buy_qty || "1"),
getYItem: coupon.reward?.bxgy_reward?.item_id || "",
getYQty: String(coupon.reward?.bxgy_reward?.qty || "1"),

    usageLimit: String(coupon.limits?.total_usage_limit || ""),
    usagePerUserLimit: String(coupon.limits?.usage_per_user || "1"),

    isActive: coupon.is_active !== false,
    stackable: coupon.stacking?.can_combine || false,
  };
}

function buildPayload(form: CouponFormState): CouponPayload {
const rewardType: "percentage" | "flat" | "free_delivery" | "bxgy" =
  form.discountType === "PERCENTAGE"
    ? "percentage"
    : form.discountType === "FLAT"
      ? "flat"
      : form.discountType === "BXGY"
        ? "bxgy"  // ← ADD THIS
        : "free_delivery";

  return {
    code: form.code.trim().toUpperCase(),
    title: form.title.trim(),
    description: form.description.trim(),

    type: form.couponType,
    is_active: form.isActive,

    validity: {
      start_date: form.validFrom || null,
      end_date: form.validTill || null,
      timezone: form.timezone,
      days_allowed: form.daysAllowed
        .map((checked, i) => (checked ? i : null))
        .filter((i) => i !== null) as number[],
      time_ranges: tryParseJson(form.timeRangesJson, []),
    },

    targeting: {
      restaurants: csvToList(form.applicableRestaurants),
      cuisines: csvToList(form.applicableCuisines),
      cities: csvToList(form.applicableCities),
      user_ids: csvToList(form.applicableUserIds),
    },

    conditions: {
      min_order_amount: toNumber(form.minOrderAmount),
      max_order_amount: toNumber(form.maxOrderAmount),
      min_items: toNumber(form.minItems),
      first_order: form.firstOrder,
      second_order: form.secondOrder,
      order_number: { min: null, max: null },
      min_restaurant_spend: toNumber(form.minRestaurantSpend),
      payment_methods: form.paymentMethods as PaymentMethod[],
      allowed_platforms: form.allowedPlatforms as Platform[],
      requires_items: tryParseJson(form.requiresItemsJson, []),
      buy_x_get_y: form.buyXGetYEnabled
        ? {
            buy_item: form.buyXItem,
            buy_qty: toNumber(form.buyXQty) || 1,
            get_item: form.getYItem,
            get_qty: toNumber(form.getYQty) || 1,
          }
        : null,
    },

reward: {
  type: rewardType,
  value: rewardType === "bxgy" ? 0 : (rewardType === "free_delivery" ? 0 : toNumber(form.discountValue) ?? 0),
  max_discount: rewardType === "percentage" ? toNumber(form.maxDiscount) : null,
  bxgy_reward: form.buyXGetYEnabled
    ? {
        item_id: form.getYItem,  // The FREE item
        qty: toNumber(form.getYQty) || 1,
      }
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

// ════════════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════════════

export default function CouponForm({
  mode,
  initialData,
  loading = false,
  onSubmit,
  onCancel,
}: CouponFormProps) {
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [error, setError] = useState("");

  const [expandedSections, setExpandedSections] = useState({
    description: true,
    reward: true,
    validity: true,
    conditions: true,
    targeting: true,
    limits: true,
  });

  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [menuItems, setMenuItems] = useState<any[]>([]);
useEffect(() => {
  const fetchMenuItems = async () => {
    try {
      const response = await fetch("http://localhost:5010/api/menu");
      const data = await response.json();
      setMenuItems(data.data || []);
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
    }
  };

  fetchMenuItems();
}, []);




  useEffect(() => {
    setForm(hydrateForm(initialData));
  }, [initialData]);

  const payload = useMemo(() => buildPayload(form), [form]);

  const validate = () => {
    if (!payload.code) return "Coupon code is required.";
    if (!payload.title) return "Coupon title is required.";

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
      return "Percentage cannot exceed 100%.";
    }

    if (payload.reward.value < 0) {
      return "Discount value cannot be negative.";
    }

    if (
      payload.validity.start_date &&
      payload.validity.end_date &&
      new Date(payload.validity.end_date).getTime() <
        new Date(payload.validity.start_date).getTime()
    ) {
      return "End date must be after start date.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      await onSubmit(payload);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save coupon."
      );
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev],
    }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            {mode === "edit" ? "Edit Coupon" : "Create Coupon"}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Configure all conditions, rewards, targeting, and validity rules.
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

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION: DESCRIPTION */}
      {/* ══════════════════════════════════════════════════════ */}
      <Section
        title="Description"
        isOpen={expandedSections.description}
        onToggle={() => toggleSection("description")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Code" hint="Unique identifier (e.g., SAVE200)">
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

          <Field label="Title" hint="Display name for users">
            <input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              placeholder="Summer special offer"
              required
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>

          <Field label="Coupon Type" hint="Manual, auto-apply, or reward">
            <select
              value={form.couponType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  couponType: e.target.value as CouponType,
                }))
              }
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            >
              <option value="coupon">Manual Coupon</option>
              <option value="auto_apply">Auto-Apply</option>
              <option value="reward">Reward</option>
            </select>
          </Field>

          <div>
            <CheckField
              label="Active"
              checked={form.isActive}
              onChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  isActive: checked,
                }))
              }
              hint="Enable/disable this coupon"
            />
          </div>

          <div className="md:col-span-2">
            <Field label="Description" hint="Internal notes (admin only)">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Summer promo for new users..."
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-zinc-400"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION: REWARD */}
      {/* ══════════════════════════════════════════════════════ */}
      <Section
        title="Reward"
        isOpen={expandedSections.reward}
        onToggle={() => toggleSection("reward")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Discount Type" hint="How reward is given">
            <select
              value={form.discountType}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  discountType: e.target.value as DiscountType,
                }))
              }
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FLAT">Flat Amount (₹)</option>
              <option value="FREE_DELIVERY">Free Delivery</option>
                <option value="BXGY">Buy X Get Y</option>  {/* ← ADD THIS */}

            </select>
          </Field>

         {form.discountType !== "FREE_DELIVERY" && form.discountType !== "BXGY" ? (
  <Field label="Discount Value">
    <input
      value={form.discountValue}
      onChange={(e) =>
        setForm((prev) => ({
          ...prev,
          discountValue: e.target.value,
        }))
      }
      type="number"
      min="0"
      step="0.01"
      placeholder={form.discountType === "PERCENTAGE" ? "20" : "500"}
      className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
    />
  </Field>
) : null}

          {form.discountType === "PERCENTAGE"  ? (
            <Field label="Max Discount Cap" hint="Max amount user saves (₹)">
              <input
                value={form.maxDiscount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    maxDiscount: e.target.value,
                  }))
                }
                type="number"
                min="0"
                step="0.01"
                placeholder="500"
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
              />
            </Field>
          ) : null}

          <div className="md:col-span-2">
  <CheckField
    label="Buy X Get Y"
    checked={form.buyXGetYEnabled}
    onChange={(checked) =>
      setForm((prev) => ({
        ...prev,
        buyXGetYEnabled: checked,
      }))
    }
    hint="Special bundle promotion"
  />
</div>

{form.buyXGetYEnabled ? (
  <>
    <Field label="Buy Item">
      <select 
        value={form.buyXItem}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            buyXItem: e.target.value,
          }))
        }
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
      >
        <option value="">Select item to buy</option>
        {menuItems?.map(item => (
          <option key={item._id} value={item._id}>
            {item.name} (₹{item.price})
          </option>
        ))}
      </select>
    </Field>
    
    <Field label="Buy Quantity">
      <input 
        type="number" 
        value={form.buyXQty}
        onChange={(e) => setForm(prev => ({ ...prev, buyXQty: e.target.value }))}
        min="1"
        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
      />
    </Field>

    <Field label="Get Item (Free)">
      <select 
        value={form.getYItem}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            getYItem: e.target.value,
          }))
        }
        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
      >
        <option value="">Select item to give free</option>
        {menuItems?.map(item => (
          <option key={item._id} value={item._id}>
            {item.name} (₹{item.price})
          </option>
        ))}
      </select>
    </Field>

    <Field label="Get Quantity">
      <input 
        type="number" 
        value={form.getYQty}
        onChange={(e) => setForm(prev => ({ ...prev, getYQty: e.target.value }))}
        min="1"
        className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
      />
    </Field>
  </>
) : null}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION: VALIDITY (Date/Time/Day) */}
      {/* ══════════════════════════════════════════════════════ */}
      <Section
        title="Validity"
        isOpen={expandedSections.validity}
        onToggle={() => toggleSection("validity")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Valid From">
            <input
              value={form.validFrom}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  validFrom: e.target.value,
                }))
              }
              type="datetime-local"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>

          <Field label="Valid Till">
            <input
              value={form.validTill}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  validTill: e.target.value,
                }))
              }
              type="datetime-local"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>

          <Field label="Timezone" hint="For day/time calculations">
            <select
              value={form.timezone}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  timezone: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Bangalore">Asia/Bangalore (IST)</option>
              <option value="UTC">UTC</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-3">
              Valid Days of Week
            </label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day, i) => (
                <label key={i} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.daysAllowed[i]}
                    onChange={(e) => {
                      const newDays = [...form.daysAllowed];
                      newDays[i] = e.target.checked;
                      setForm((prev) => ({
                        ...prev,
                        daysAllowed: newDays,
                      }));
                    }}
                    className="rounded border-zinc-300 cursor-pointer"
                  />
                  <span className="text-xs text-zinc-600">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Field label="Time Ranges (JSON)" hint="[{start: '09:00', end: '17:00'}]">
              <textarea
                rows={2}
                value={form.timeRangesJson}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    timeRangesJson: e.target.value,
                  }))
                }
                placeholder='[{"start": "09:00", "end": "17:00"}]'
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-xs outline-none transition focus:border-zinc-400 font-mono"
              />
            </Field>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION: CONDITIONS */}
      {/* ══════════════════════════════════════════════════════ */}
      <Section
        title="Conditions"
        isOpen={expandedSections.conditions}
        onToggle={() => toggleSection("conditions")}
      >
        <div className="space-y-4">
          {/* Order Amount */}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Min Order Amount">
              <input
                value={form.minOrderAmount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    minOrderAmount: e.target.value,
                  }))
                }
                type="number"
                min="0"
                step="0.01"
                placeholder="500"
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
              />
            </Field>

            <Field label="Max Order Amount">
              <input
                value={form.maxOrderAmount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    maxOrderAmount: e.target.value,
                  }))
                }
                type="number"
                min="0"
                step="0.01"
                placeholder="5000"
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
              />
            </Field>
          </div>

          {/* Item Count */}
          <Field label="Min Items in Cart">
            <input
              value={form.minItems}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  minItems: e.target.value,
                }))
              }
              type="number"
              min="0"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>

          {/* Order History */}
          <div className="grid gap-3 md:grid-cols-2">
            <CheckField
              label="First Order Only"
              checked={form.firstOrder}
              onChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  firstOrder: checked,
                }))
              }
            />
            <CheckField
              label="Second Order Only"
              checked={form.secondOrder}
              onChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  secondOrder: checked,
                }))
              }
            />
          </div>

          {/* Restaurant Spend */}
          <Field label="Min Restaurant Spend" hint="Lifetime spend required (₹)">
            <input
              value={form.minRestaurantSpend}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  minRestaurantSpend: e.target.value,
                }))
              }
              type="number"
              min="0"
              step="0.01"
              placeholder="2000"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>

          {/* Payment Methods */}
          <Field label="Payment Methods" hint="Leave empty for all">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {["UPI", "CARD", "WALLET", "NET_BANKING", "CASH"].map((method) => (
                <label key={method} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.paymentMethods.includes(method)}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        paymentMethods: e.target.checked
                          ? [...prev.paymentMethods, method]
                          : prev.paymentMethods.filter((m) => m !== method),
                      }));
                    }}
                    className="rounded border-zinc-300 cursor-pointer"
                  />
                  <span className="text-sm text-zinc-700">{method}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* Platforms */}
          <Field label="Allowed Platforms" hint="Leave empty for all">
            <div className="grid grid-cols-3 gap-2">
              {["WEB", "MOBILE", "APP"].map((platform) => (
                <label key={platform} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allowedPlatforms.includes(platform)}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        allowedPlatforms: e.target.checked
                          ? [...prev.allowedPlatforms, platform]
                          : prev.allowedPlatforms.filter((p) => p !== platform),
                      }));
                    }}
                    className="rounded border-zinc-300 cursor-pointer"
                  />
                  <span className="text-sm text-zinc-700">{platform}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* Required Items */}
          <Field label="Required Items (JSON)" hint="[{item_id: '...', qty: 2}]">
            <textarea
              rows={2}
              value={form.requiresItemsJson}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  requiresItemsJson: e.target.value,
                }))
              }
              placeholder='[{"item_id": "507f1f77bcf86cd799439011", "qty": 2}]'
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-xs outline-none transition focus:border-zinc-400 font-mono"
            />
          </Field>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION: TARGETING */}
      {/* ══════════════════════════════════════════════════════ */}
      <Section
        title="Targeting"
        isOpen={expandedSections.targeting}
        onToggle={() => toggleSection("targeting")}
      >
        <div className="grid gap-4">
          <Field label="Applicable Restaurants" hint="IDs, comma-separated">
            <input
              value={form.applicableRestaurants}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  applicableRestaurants: e.target.value,
                }))
              }
              placeholder="r1, r2, r3"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>

          <Field label="Applicable Cuisines" hint="Names, comma-separated">
            <input
              value={form.applicableCuisines}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  applicableCuisines: e.target.value,
                }))
              }
              placeholder="Indian, Italian, Chinese"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>

          <Field label="Applicable Cities" hint="Names, comma-separated">
            <input
              value={form.applicableCities}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  applicableCities: e.target.value,
                }))
              }
              placeholder="Vadodara, Mumbai, Delhi"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>

          <Field label="Applicable User IDs" hint="User IDs, comma-separated">
            <input
              value={form.applicableUserIds}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  applicableUserIds: e.target.value,
                }))
              }
              placeholder="user1, user2, user3"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>

          <CheckField
            label="Stackable"
            checked={form.stackable}
            onChange={(checked) =>
              setForm((prev) => ({
                ...prev,
                stackable: checked,
              }))
            }
            hint="Can combine with other coupons"
          />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════════════ */}
      {/* SECTION: LIMITS */}
      {/* ══════════════════════════════════════════════════════ */}
      <Section
        title="Limits"
        isOpen={expandedSections.limits}
        onToggle={() => toggleSection("limits")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Total Usage Limit" hint="Leave empty for unlimited">
            <input
              value={form.usageLimit}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  usageLimit: e.target.value,
                }))
              }
              type="number"
              min="0"
              step="1"
              placeholder="1000"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>

          <Field label="Usage Per User" hint="Times per user">
            <input
              value={form.usagePerUserLimit}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  usagePerUserLimit: e.target.value,
                }))
              }
              type="number"
              min="1"
              step="1"
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400"
            />
          </Field>
        </div>
      </Section>

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

// ════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ════════════════════════════════════════════════════════════════

function Section({
  title,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-5 border border-zinc-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 hover:bg-zinc-100 transition"
      >
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <span
          className={`text-lg text-zinc-500 transition transform ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-zinc-200">
          {children}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-700">{label}</span>
        {hint && (
          <span className="text-xs text-zinc-500">({hint})</span>
        )}
      </span>
      {children}
    </label>
  );
}

function CheckField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 rounded border-zinc-300 cursor-pointer"
      />
      <div>
        <span className="text-sm font-medium text-zinc-700">{label}</span>
        {hint && (
          <p className="text-xs text-zinc-500 mt-0.5">{hint}</p>
        )}
      </div>
    </label>
  );
}
