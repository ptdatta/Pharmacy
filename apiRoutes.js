const express = require("express");
const router = express.Router();
const con = require("./dbconnection");

router.get("/api/products", (req, res) => {
  const { UId } = req.query;

  const sql = `
    SELECT Product.*, 
           CASE WHEN Cart.producttId IS NOT NULL THEN true ELSE false END AS inCart
    FROM Product
    LEFT JOIN Cart ON Product.producttId = Cart.producttId AND Cart.UId = ?
  `;

  con.query(sql, [UId], (error, results) => {
    if (error) {
      return console.error(error.message);
    }
    res.send(results);
  });
});

router.get("/api/product", (req, res) => {
  const { productId } = req.query;
  const sql = `SELECT * FROM Product WHERE producttId = ?`;
  con.query(sql, [productId], (error, results) => {
    if (error) {
      return console.error(error.message);
    }
    res.send(results);
  });
});

router.get("/api/totalCount", (req, res) => {
  const { tableName } = req.query;
  const sql = `SELECT COUNT(*) AS totalCount FROM ${tableName}`;
  con.query(sql, (error, results) => {
    if (error) {
      return res.status(500).send(error.message);
    }
    if (results.length === 0) {
      return res.status(404).send("Table not found or has no rows");
    }
    const totalCount = results[0].totalCount;
    res.json({ totalCount });
  });
});

router.post("/api/addToCart", (req, res) => {
  const { UId, productId, quantity, price } = req.body;
  const sql = `
    INSERT INTO Cart (UId, producttId, quantity, price)
    VALUES (?, ?, ?, ?)
  `;
  con.query(sql, [UId, productId, quantity, price], (error) => {
    if (error) {
      console.error("Error adding item to cart:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    res.status(200).json({ message: "Item added to cart successfully" });
  });
});

router.put("/api/updateCart", (req, res) => {
  const { value, UId, productId } = req.query;
  let sql;
  switch (value) {
    case "increase":
      sql = `
        UPDATE Cart
        SET quantity = quantity + 1,
            price = price * 2
        WHERE UId = ? AND producttId = ?
      `;
      break;
    case "decrease":
      sql = `
        UPDATE Cart
        SET quantity = GREATEST(quantity - 1, 0),
            price = GREATEST(price / 2, 0)
        WHERE UId = ? AND producttId = ?
      `;
      break;
    case "remove":
      sql = `
        DELETE FROM Cart
        WHERE UId = ? AND producttId = ?
      `;
      break;
    default:
      return res.status(400).json({ message: "Invalid 'value' parameter" });
  }
  con.query(sql, [UId, productId], (error, result) => {
    if (error) {
      console.error("Error updating cart:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (value === "decrease" && result.affectedRows === 0) {
      sql = `
        DELETE FROM Cart
        WHERE UId = ? AND producttId = ?
      `;
      con.query(sql, [UId, productId], (deleteError) => {
        if (deleteError) {
          console.error("Error removing item from cart:", deleteError);
          return res.status(500).json({ message: "Internal Server Error" });
        }
        res.status(200).json({ message: "Cart updated successfully" });
      });
    } else {
      res.status(200).json({ message: "Cart updated successfully" });
    }
  });
});

router.get("/api/getCartbyUser", (req, res) => {
  const { UId } = req.query;
  const sql = `
  SELECT Cart.*, Product.*
  FROM Cart
  INNER JOIN Product ON Cart.producttId = Product.producttId
  WHERE Cart.UId = ?
  `;
  con.query(sql, [UId], (error, results) => {
    if (error) {
      console.error("Error getting cart by user:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "No items found for the specified user" });
    }
    res.status(200).json(results);
  });
});

router.delete("/api/deleteCartByUser", (req, res) => {
  const { UId } = req.query;
  const sql = `
    DELETE FROM Cart
    WHERE UId = ?
  `;
  pool.query(sql, [UId], (error, result) => {
    if (error) {
      console.error("Error deleting cart by user:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No items found for the specified user" });
    }
    res.status(200).json({ message: "Cart deleted successfully" });
  });
});

module.exports = router;
