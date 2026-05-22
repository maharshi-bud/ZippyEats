import express from "express";
import {
  getProfile,
  getUserStats,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";
import { uploadProfilePic, getProfilePic, getMyCoins , deleteProfilePic} from "../controllers/userController.js";
// import { uploadProfilePic, getProfilePic, getMyCoins, deleteProfilePic } from "../controllers/userController.js";

const router = express.Router();


const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
router.post("/me/profile-pic", protect, upload.single("pic"), uploadProfilePic);
router.get("/me/profile-pic", protect, getProfilePic);
router.get("/me/coins", protect, getMyCoins);
router.delete("/me/profile-pic", protect, deleteProfilePic);
// Profile & stats
router.get("/me", protect, getProfile);
router.get("/stats", protect, getUserStats);

// Address management
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.put("/addresses/:addressId", protect, updateAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);
router.patch("/addresses/:addressId/default", protect, setDefaultAddress);

export default router;
