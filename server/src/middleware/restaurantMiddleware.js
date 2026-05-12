export const restaurantOnly = (
  req,
  res,
  next
) => {
  console.log(req.user);

  const allowedRoles = [
    "restaurant",
    "restaurant_owner",
    "owner",
  ];

  if (
    !allowedRoles.includes(req.user?.role)
  ) {
    return res.status(403).json({
      message: "Restaurant access only",
    });
  }

  next();
};