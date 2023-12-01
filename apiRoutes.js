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


module.exports = router;
