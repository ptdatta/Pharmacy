const express = require("express");
const router = express.Router();
const con = require("./dbconnection");
const bcrypt = require("bcrypt");

router.post("/api/register", (req, res) => {
  const { UId, name, email, phone, address, password } = req.body;
  con.query(
    `SELECT UId FROM Users WHERE name = ? && email = ?`,
    [name,email],
    (error, results) => {
      if (error) {
        return console.error(error.message);
      }
      if (results.length === 0) {
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) {
            return console.error(err);
          }
          const insertSql = `INSERT INTO Users (UId, name, email, phone, address, password) VALUES (?, ?, ?, ?, ?, ?)`;
          const values = [UId, name, email, phone, address, hash];
          con.query(insertSql, values, (error, results) => {
            if (error) {
              return console.error(error.message);
            }
            res.send("User added successfully");
          });
        });
      } else {
        return res.status(409).json({ msg: "*User Already Exists" });
      }
    }
  );
});

router.post("/api/login", (req, res) => {
  const { name, password } = req.body;
  const sql = `SELECT UId, name, email, phone, address, password FROM Users WHERE name = '${name}'`;
  con.query(sql, (error, results) => {
    if (error) {
      return console.error(error.message);
    }
    if (results.length === 0) {
      return res.status(401).json({ msg: "*No User Found" });
    }
    for (const user of results) {
      const hashedPassword = user.password;
      bcrypt.compare(password, hashedPassword, (err, passwordMatch) => {
        if (err) {
          return console.error(err);
        }
        if (passwordMatch) {
          const userDetails = {
            UId: user.UId,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
          };
          return res.send(userDetails);
        } else {
          return res.status(401).json({ msg: "*Password Incorrect" });
        }
      });
    }
  });
});

module.exports = router;
