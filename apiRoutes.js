const express = require("express");
const router = express.Router();
const con = require("./dbconnection");

router.get("/api/products", (req, res) => {
  const sql = "SELECT * FROM Product";
  con.query(sql, (error, results) => {
    if (error) {
      return console.error(error.message);
    }
    res.send(results);
  });
});

module.exports = router;
