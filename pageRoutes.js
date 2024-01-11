const express = require("express");
const router = express.Router();


router.get("/register", (req, res) => {
  res.sendFile("pages/register.html", { root: __dirname });
});

router.get("/login", (req, res) => {
  res.sendFile("pages/login.html", { root: __dirname });
});

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

router.get("/product/:productId", (req, res) => {
  res.sendFile("pages/product.html", { root: __dirname });
});


module.exports = router;
