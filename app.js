const express = require("express");
const bodyParser = require("body-parser");
const pageRoutes = require("./pageRoutes");
const apiRoutes = require("./apiRoutes");
const authRoutes = require("./authRoutes");
const path = require('path');

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'pages')));
app.use(bodyParser.urlencoded({ extended: false }));
const port = 3000;

app.use("/", pageRoutes);
app.use("/", apiRoutes);
app.use("/", authRoutes);

app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
