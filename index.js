require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

const {
  url_get_controller,
  url_post_controller,
} = require("./controllers/urlHandler");

app.get("/api/shorturl/:id", url_get_controller);
app.post("/api/shorturl", url_post_controller);

app.use((req, res, next) => {
  res.status(404);
  res.json({ error: "Invalid API endpoint" });
});

app.use((err, req, res, next) => {
  res.json({ error: err.message });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
