// server/src/routes/admin/index.js

const router = require("express").Router();
const auth = require("../../middleware/authMiddleware");
const admin = require("../../middleware/adminMiddleware");

router.use(auth, admin);

// TEMP test route
router.get("/test", (req, res) => {
  res.json({ message: "Admin route working" });
});

module.exports = router;