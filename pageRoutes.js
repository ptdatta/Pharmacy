const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.sendFile("pages/home.html", { root: __dirname });
});

router.get("/cart", (req, res) => {
  res.sendFile("pages/cart.html", { root: __dirname });
});

router.get("/profile", (req, res) => {
  res.sendFile("pages/profile.html", { root: __dirname });
});

router.get("/admin", (req, res) => {
  res.sendFile("pages/admin.html", { root: __dirname });
});

module.exports = router;