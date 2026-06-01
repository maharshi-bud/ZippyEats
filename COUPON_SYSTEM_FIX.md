# Coupon System Fix - Complete Documentation

## 🎯 Problem Summary
The coupon system was **functionally working** but **coupon usage was never recorded** in MongoDB because:
- **Root Cause**: `appliedCouponId` became `undefined` during order creation
- **Reason**: API returned `coupon_id` but frontend code tried to access `_id`
- **Result**: The check `if (appliedCouponId)` failed, so `createCouponUsage()` never ran

## ✅ Solutions Implemented

### 1. **Backend: API Response Fix** (`server/src/controllers/couponController.js`)
**Issue**: `/api/coupons/apply` returned `coupon_id` only
```javascript
// BEFORE (incomplete)
data: {
  coupon_id: coupon._id,  // Only this field
  code: coupon.code,
  discount_amount: reward.discount_amount,
  // ...
}

// AFTER (complete)
data: {
  _id: coupon._id,              // ← NEW: Frontend expects this
  coupon_id: coupon._id,        // ← Keep for backward compatibility
  code: coupon.code,
  discount_amount: reward.discount_amount,
  // ...
}
```
**Impact**: Frontend can now access `appliedCoupon._id` correctly

---

### 2. **Backend: Order Schema Enhanced** (`server/src/models/Order.js`)
**Issue**: Order model didn't store coupon details

**Added Fields**:
```javascript
// Coupon tracking fields
coupon_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Coupon",
  default: null,
}

coupon_code: {
  type: String,
  default: null,
}

coupon_discount: {
  type: Number,
  default: 0,
  min: 0,
}

coupon_cashback: {
  type: Number,
  default: 0,
  min: 0,
}
```
**Impact**: Orders now store complete coupon context for analytics and auditing

---

### 3. **Backend: Order Creation Logic** (`server/src/controllers/orderController.js`)
**Issue**: Order wasn't storing coupon data, even when applied

**Changes**:
```javascript
// Store coupon fields directly in order document
const order = await Order.create([{
  // ... other fields ...
  coupon_id: appliedCouponId || null,
  coupon_code: req.body.coupon_code || null,
  coupon_discount: discountAmount,
  coupon_cashback: cashbackAmount,
  
  // Include coupon discount in final total
  total_amount: total + 40 - coinsDiscount - discountAmount,
}])

// Then create usage record (only if coupon was applied)
if (appliedCouponId) {
  await createCouponUsage({
    couponId: appliedCouponId,
    userId,
    orderId: order[0]._id,
    discountAmount,
    cashbackAmount,
    rewardType,
  });
}
```

**Improvements**:
- ✅ Removed duplicate `redeemAppliedCoupon()` call (was creating duplicate records)
- ✅ Added comprehensive logging for debugging
- ✅ Added try-catch to prevent coupon failures from breaking order creation
- ✅ Final total correctly includes coupon discount

---

### 4. **Backend: Coupon Usage Service** (`server/src/services/couponUsageService.js`)
**Issue**: Minimal error handling and logging

**Enhanced with**:
- ✅ Detailed logging at each step
- ✅ Logs creation of usage record with ID
- ✅ Logs coupon usage count increment
- ✅ Better error handling with context
- ✅ Returns created usage object

---

## 📊 Data Flow (Fixed)

### Frontend Checkout Flow
```
1. User applies coupon code
   ↓
2. POST /api/coupons/apply → {code: "SUMMER50", cart: {...}}
   ↓
3. Response: {_id: "xxx", coupon_id: "xxx", code: "SUMMER50", discount_amount: 100}
   ↓
4. Store in appliedCoupon state
   ↓
5. User places order
   ↓
6. POST /api/orders → {appliedCouponId: "xxx", discountAmount: 100, ...}
```

### Backend Order Creation Flow
```
1. Receive order payload with appliedCouponId: "xxx"
   ↓
2. Create Order document with:
   - coupon_id: "xxx"
   - coupon_code: "SUMMER50"
   - coupon_discount: 100
   - total_amount: (subtotal + delivery) - discount
   ↓
3. After transaction commits:
   - Check if appliedCouponId exists
   ↓
4. Call createCouponUsage()
   - Create CouponUsage record
   - Increment Coupon.limits.current_usage_count
   ↓
5. Log success/failure
```

---

## 🧪 Testing Guide

### Test 1: Coupon Applied Successfully
```bash
# 1. Apply coupon
curl -X POST http://localhost:5000/api/coupons/apply \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "SUMMER50",
    "cart": {
      "subtotal": 500,
      "delivery_fee": 40,
      "restaurant_id": "xxx",
      "city": "Ahmedabad"
    }
  }'

# Expected Response:
{
  "success": true,
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",      ← NEW FIELD
    "coupon_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "code": "SUMMER50",
    "discount_amount": 100,
    "cashback_amount": 0,
    "reward_type": "percentage",
    "totals": {...}
  }
}

# 2. Place order with coupon
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [...],
    "appliedCouponId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "coupon_code": "SUMMER50",
    "discountAmount": 100,
    "cashbackAmount": 0,
    "rewardType": "percentage"
  }'

# Expected: Order created successfully

# 3. Verify in MongoDB
db.orders.findOne({coupon_code: "SUMMER50"})
# Should return document with:
# - coupon_id: ObjectId("64f1a2b3c4d5e6f7g8h9i0j1")
# - coupon_code: "SUMMER50"
# - coupon_discount: 100
# - total_amount: (subtotal + 40) - 100

db.couponusages.findOne({coupon_code: "SUMMER50"})
# Should return document with:
# - coupon_id: ObjectId("64f1a2b3c4d5e6f7g8h9i0j1")
# - user_id: ObjectId(...)
# - order_id: ObjectId(...)
# - discount_amount: 100

db.coupons.findOne({code: "SUMMER50"})
# Verify limits.current_usage_count incremented
```

### Test 2: No Coupon Applied
```bash
# Place order WITHOUT coupon
curl -X POST http://localhost:5000/api/orders \
  -d '{
    "items": [...],
    "appliedCouponId": null,
    "discountAmount": 0
  }'

# Verify in MongoDB
db.orders.findOne({_id: ObjectId("...")})
# Should have:
# - coupon_id: null
# - coupon_code: null
# - coupon_discount: 0

db.couponusages.find({order_id: ObjectId("...")})
# Should return EMPTY (no usage record created)
```

### Test 3: Check Server Logs
```
Monitor logs for these messages:

✅ [Order] appliedCouponId: 64f1a2b3c4d5e6f7g8h9i0j1
✅ [Order] discountAmount: 100
✅ [Order] Coupon fields in order: {...}
✅ [Order] Creating coupon usage...
✅ [CouponUsage] Usage record created: 64f2x3y4z5a6b7c8d9e0f1g2
✅ [CouponUsage] Coupon usage count updated: {new_count: 15}

❌ If you see these, there's still an issue:
❌ [Order] appliedCouponId: undefined
❌ [Order] No coupon applied (when coupon should be applied)
```

---

## 📈 What Changed in Database

### Before (Broken)
```javascript
// orders collection
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),
  items: [...],
  total_amount: 540,  // No discount applied
  // ❌ No coupon fields!
}

// couponusages collection
{ }  // ❌ EMPTY! No usage records created
```

### After (Fixed)
```javascript
// orders collection
{
  _id: ObjectId("..."),
  user_id: ObjectId("..."),
  items: [...],
  coupon_id: ObjectId("64f1a2b3c4d5e6f7g8h9i0j1"),
  coupon_code: "SUMMER50",
  coupon_discount: 100,
  coupon_cashback: 0,
  total_amount: 440,  // ✅ Discount applied!
}

// couponusages collection
{
  _id: ObjectId("64f2x3y4z5a6b7c8d9e0f1g2"),
  coupon_id: ObjectId("64f1a2b3c4d5e6f7g8h9i0j1"),
  user_id: ObjectId("..."),
  order_id: ObjectId("..."),
  discount_amount: 100,
  cashback_amount: 0,
  reward_type: "percentage",
  createdAt: ISODate("2026-06-01T..."),
  updatedAt: ISODate("2026-06-01T...")
}

// coupons collection
{
  _id: ObjectId("64f1a2b3c4d5e6f7g8h9i0j1"),
  code: "SUMMER50",
  limits: {
    current_usage_count: 15  // ✅ Incremented!
  }
}
```

---

## 🔍 Production Checklist

- [x] API returns `_id` field for frontend compatibility
- [x] Order model stores all coupon details
- [x] Order creation stores coupon data
- [x] Coupon usage records created after order
- [x] Coupon usage counter increments atomically
- [x] Error handling prevents order failure on coupon issues
- [x] Comprehensive logging for debugging
- [x] No duplicate usage records created
- [ ] Test with real coupons in production
- [ ] Monitor MongoDB for usage records
- [ ] Alert on any failed coupon tracking
- [ ] Analytics dashboard shows coupon usage

---

## 🚀 Deployment Steps

1. **Backup MongoDB**
   ```bash
   mongodump --uri "mongodb://..." --out /backup/coupon-fix-$(date +%s)
   ```

2. **Update Code**
   - Deploy `couponController.js` (API fix)
   - Deploy `Order.js` (schema update)
   - Deploy `orderController.js` (order creation logic)
   - Deploy `couponUsageService.js` (enhanced logging)

3. **Database Migration**
   ```bash
   # No migration needed - new fields default to null/0
   # Existing orders keep their values unchanged
   ```

4. **Restart Server**
   ```bash
   npm run dev  # or production start command
   ```

5. **Verify**
   - Test with a coupon on staging
   - Check MongoDB for usage records
   - Monitor logs for errors

---

## 📞 Support & Issues

### If Coupons Still Don't Work

1. **Check Logs**
   ```bash
   # Search for coupon-related errors
   grep -i "coupon\|applied" server.log
   ```

2. **Check Frontend**
   - Open DevTools → Network tab
   - Apply coupon → Check `/api/coupons/apply` response
   - Verify it includes `_id` field
   - Place order → Check `/api/orders` payload
   - Verify `appliedCouponId` is NOT null

3. **Check Database**
   ```javascript
   db.couponusages.find({}).count()  // Should increase after orders
   db.orders.find({coupon_code: {$ne: null}}).count()  // Orders with coupons
   ```

4. **Check Coupon Validity**
   - Is the coupon `is_active: true`?
   - Is it within `validity.start_date` and `validity.end_date`?
   - Has usage limit been reached?

---

## 🎉 Success Indicators

✅ You'll know it's working when:
- [ ] `/api/coupons/apply` returns `_id` field
- [ ] Order document includes `coupon_id`, `coupon_code`, `coupon_discount`
- [ ] CouponUsage records appear after placing order
- [ ] Coupon `limits.current_usage_count` increments
- [ ] Server logs show "Coupon usage created successfully"
- [ ] Dashboard shows coupon usage statistics
