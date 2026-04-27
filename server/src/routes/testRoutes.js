import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/db-test", async (req, res, next) => {
  try {
    const state = mongoose.connection.readyState;

    res.json({
      success: true,
      mongoState: state
    });
  } catch (err) {
    next(err);
  }
});

export default router;