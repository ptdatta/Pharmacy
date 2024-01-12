const express = require("express");
const router = express.Router();
const con = require("./dbconnection");

router.get("/api/products", (req, res) => {
  const { name } = req.query;
  let sql = `SELECT * FROM Product WHERE totalQuantity > 0`;
  if (name && name !== "") {
    sql += ` AND pname LIKE '${name}%'`;
  }
  con.query(sql, (error, results) => {
    if (error) {
      return console.error(error.message);
    }
    res.send(results);
  });
});

router.get("/api/product", (req, res) => {
  const { productId, UId } = req.query;
  const sql = `SELECT 
    Product.*,
    CASE WHEN Cart.producttId IS NOT NULL THEN true ELSE false END AS inCart
  FROM 
    Product
  LEFT JOIN 
    Cart ON Product.producttId = Cart.producttId AND Cart.UId = ?
  WHERE 
    Product.producttId = ?;
  `;
  con.query(sql, [UId, productId], (error, results) => {
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
  if (value == 0) {
    sql = `DELETE FROM Cart WHERE UId='${UId}' AND producttId='${productId}'`;
  } else {
    sql = `UPDATE Cart SET quantity = '${value}',price = '${value}' * (SELECT singlePrice FROM Product WHERE producttId= '${productId}') WHERE producttId='${productId}' AND UId = '${UId}'`;
  }
  con.query(sql, (error) => {
    if (error) {
      console.error("Error updating item to cart:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    res.status(200).json({ message: "Cart Updated Successfully" });
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
    res.status(200).json(results);
  });
});

router.delete("/api/deleteCartByUser", (req, res) => {
  const { UId } = req.query;
  const sql = `
    DELETE FROM Cart
    WHERE UId = ?
  `;
  con.query(sql, [UId], (error, result) => {
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

router.post("/api/order", (req, res) => {
  const { UId, address, value, price, status } = req.body;
  const sqlInsertOrder = `
    INSERT INTO Orders (UId, Address, Value, Price, Status)
    VALUES (?, ?, ?, ?, ?)
  `;
  const sqlDeleteCart = `
    DELETE FROM Cart
    WHERE UId = ?
  `;
  const sqlUpdateProductQuantities = `
    UPDATE Product
    SET totalQuantity = totalQuantity - ?
    WHERE pname = ?;
  `;

  con.beginTransaction((error) => {
    if (error) {
      console.error("Error starting transaction", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    con.query(
      sqlInsertOrder,
      [UId, address, JSON.stringify(value), price, status],
      (error, results) => {
        if (error) {
          return con.rollback(() => {
            console.error("Error inserting into Orders", error);
            res.status(500).json({ message: "Internal Server Error" });
          });
        }

        con.query(sqlDeleteCart, [UId], (error) => {
          if (error) {
            return con.rollback(() => {
              console.error("Error deleting from Cart", error);
              res.status(500).json({ message: "Internal Server Error" });
            });
          }

          // Assuming value is an object with properties pname and quantity
          for (const pname in value) {
            const quantity = value[pname];
            con.query(
              sqlUpdateProductQuantities,
              [quantity, pname],
              (error) => {
                if (error) {
                  return con.rollback(() => {
                    console.error("Error updating product quantities", error);
                    res.status(500).json({ message: "Internal Server Error" });
                  });
                }
              }
            );
          }

          con.commit((error) => {
            if (error) {
              return con.rollback(() => {
                console.error("Error committing transaction", error);
                res.status(500).json({ message: "Internal Server Error" });
              });
            }
            res.status(200).json({ message: "Order Successful, Cart Deleted, and Product Quantities Updated" });
          });
        });
      }
    );
  });
});


router.get("/api/getOrderbyUser", (req, res) => {
  const { UId } = req.query;
  const sql = `
  SELECT *
  FROM Orders
  WHERE UId = ?
  `;
  con.query(sql, [UId], (error, results) => {
    if (error) {
      console.error("Error getting order by user:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    res.status(200).json(results);
  });
});

router.put("/api/updateStatus", (req, res) => {
  const { UId, OrderId } = req.query;
  const sql = `
  UPDATE Orders
  SET status = 0
  WHERE UId = ? AND OrderId = ?;  
  `;
  con.query(sql, [UId, OrderId], (error, result) => {
    if (error) {
      console.error("Error deleting order by user:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No items found for the specified user" });
    }
    res.status(200).json({ message: "Order status updated" });
  });
});

router.delete("/api/deleteOrderByUser", (req, res) => {
  const { UId, OrderId, value } = req.body;

  // Delete the order
  const deleteOrderSQL = `
    DELETE FROM Orders
    WHERE UId = ? AND OrderId = ?;
  `;

  // Increase product quantities
  const increaseProductQuantitiesSQL = `
    UPDATE Product
    SET totalQuantity = totalQuantity + ?
    WHERE pname = ?;
  `;

  con.beginTransaction((error) => {
    if (error) {
      console.error("Error starting transaction", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    // Delete the order
    con.query(deleteOrderSQL, [UId, OrderId], (error, result) => {
      if (error) {
        return con.rollback(() => {
          console.error("Error deleting order by user:", error);
          res.status(500).json({ message: "Internal Server Error" });
        });
      }

      if (result.affectedRows === 0) {
        return con.rollback(() => {
          res.status(404).json({ message: "No items found for the specified user" });
        });
      }

      // Increase product quantities
      for (const pname in value) {
        const quantity = value[pname];
        con.query(increaseProductQuantitiesSQL, [quantity, pname], (error) => {
          if (error) {
            return con.rollback(() => {
              console.error("Error increasing product quantities", error);
              res.status(500).json({ message: "Internal Server Error" });
            });
          }
        });
      }

      con.commit((error) => {
        if (error) {
          return con.rollback(() => {
            console.error("Error committing transaction", error);
            res.status(500).json({ message: "Internal Server Error" });
          });
        }
        res.status(200).json({ message: "Order removed successfully" });
      });
    });
  });
});


module.exports = router;
