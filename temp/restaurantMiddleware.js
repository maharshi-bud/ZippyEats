// server/src/middleware/restaurantMiddleware.js
// Allows access only to users with role "restaurant"

export const restaurantOnly = (req, res, next) => {
  if (req.user?.role !== "restaurant") {
    return res.status(403).json({ message: "Restaurant access only" });
  }
  next();
};
