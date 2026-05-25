// ============================================================
// FILE: server/src/controllers/admin/userRoleController.js
// ============================================================

import User from "../../models/User.js";
import Role from "../../models/Role.js";

// ── PATCH /api/admin/users/:id/role ──────────────────────────
// Assign or change the role of any user.
// Body: { role: "admin" }
export const assignRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role: newRole } = req.body;

    if (!newRole) {
      return res.status(400).json({ message: "role is required" });
    }

    // make sure the role actually exists in the Role collection
    const roleDoc = await Role.findOne({ name: newRole, isActive: true });
    if (!roleDoc) {
      return res.status(404).json({ message: `Role "${newRole}" not found` });
    }

    const user = await User.findById(id).select("name email role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // prevent stripping the last super_admin
    if (user.role === "super_admin" && newRole !== "super_admin") {
      const superAdminCount = await User.countDocuments({ role: "super_admin" });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          message: "Cannot change role — this is the only super_admin",
        });
      }
    }

    const previousRole = user.role;
    user.role = newRole;
    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        previousRole,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[UserRole] assignRole:", err);
    res.status(500).json({ message: "Failed to assign role" });
  }
};

// ── GET /api/admin/users ──────────────────────────────────────
// List users with their current role.
// Supports ?role=admin and ?search=john filters + pagination.
export const getUsersWithRoles = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("name email role restaurant_id createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error("[UserRole] getUsersWithRoles:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};