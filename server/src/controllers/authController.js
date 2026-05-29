import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";
import { hasPanelAccess } from "../constants/permissions.js";


// FIXED
const generateToken = (userId, role, restaurantId = null, name = "") => {
  return jwt.sign({ id: userId, role, restaurant_id: restaurantId, name }, process.env.JWT_SECRET, {
    expiresIn: "9h",
  });
};

// REGISTER
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed
    });

    const token = generateToken(user._id, user.role, user.restaurant_id || null,  user.name) ;

    res.status(201).json({
      success: true,
      token
    });
  } catch (err) {
    next(err);
  }
};

// LOGIN
// export const login = async (req, res, next) => {
//   try {
//     const { email, password  } = req.body;

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }


//     const token = generateToken(user._id, user.role,user.restaurant_Id || null);

//     res.json({
//       success: true,
//       token
//     });
//   } catch (err) {
//     next(err);
//   }
// };

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    
    
    

    const token = generateToken(user._id, user.role, user.restaurant_id, user.name);
    
    // ── Fetch this role's permissions from DB ────────────────
    // Same source of truth as permissionMiddleware — the Role collection.
    // const roleDoc = await Role.findOne({ name: user.role, isActive: true }).select("permissions").lean();
    // const permissions = roleDoc?.permissions || {};
    // const panelAccess = hasPanelAccess(user.role, permissions);
    
    const roleDoc = await Role.findOne({ name: user.role, isActive: true })
      .select("permissions")
      .lean();
    
    // .lean() converts Map to plain object, so use bracket notation
    const dashPerms = roleDoc?.permissions?.dashboard;
    const panelAccess = dashPerms?.view === true;

    res.json({
  token,
  user: { id: user._id, name: user.name, email: user.email, role: user.role },
  panelAccess,
});


  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



// const token = jwt.sign(
//   {
//     user._id,
//   },
//   process.env.JWT_SECRET,
//   { expiresIn: "1h" }
// );

// authController.js

