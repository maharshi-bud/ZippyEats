import express from "express";
import {
  getRestaurants,
  getRestaurantById
} from "../controllers/restaurantController.js";

const router = express.Router();

router.get("/restaurants", getRestaurants);
router.get("/restaurant/:id", getRestaurantById);

export default router;