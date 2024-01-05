require("dotenv").config();
const { param, body, validationResult } = require("express-validator");
const dns = require("node:dns");
const { Client } = require("pg");

exports.url_get_controller = [
  param("id", "Invalid input").matches(/^\d+$/),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty) {
      next(new Error("Invalid format"));
    }
    next();
  },

  async (req, res, next) => {
    const id = req.params.id;
    const client = new Client({
      user: process.env.PGUSER,
      password: process.env.PGPASS,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT,
    });

    try {
      await client.connect();
      console.log("Database connected");
      const result = await client.query(
        "SELECT * FROM public.url WHERE id=$1",
        [id]
      );
      if (result.rows.length > 0) {
        res.redirect(result.rows[0].url);
        return;
      }
      next(new Error("No short URL found for the given input"));
    } catch (err) {
      next(err);
    } finally {
      await client.end();
      console.log("Database disconnected");
    }
  },
];

exports.url_post_controller = [
  body("url").isURL({
    protocols: ["http", "https"],
    require_protocol: true,
    require_valid_protocol: true,
    allow_trailing_dot: true,
  }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      next(new Error("Invalid URL format"));
    }
    next();
  },

  async (req, res, next) => {
    const url = req.body.url;
    const client = new Client({
      user: process.env.PGUSER,
      password: process.env.PGPASS,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      port: process.env.PGPORT,
    });

    try {
      await client.connect();
      console.log("Database connected");
      const result = await client.query(
        "SELECT * FROM public.url WHERE url=$1",
        [url]
      );

      if (result.rows.length > 0) {
        res.json({
          original_url: result.rows[0].url,
          short_url: result.rows[0].id,
        });
        return;
      }

      const hostname = new URL(url).hostname;
      let hostExists = false;
      await new Promise((resolve, reject) => {
        dns.lookup(hostname, (err, address) => {
          if (err) {
            reject(new Error("Host not found"));
          } else {
            resolve();
          }
        });
      })
        .then(() => {
          hostExists = true;
        })
        .catch((err) => next(err));

      if (hostExists) {
        await client.query("INSERT INTO public.url(url) VALUES($1)", [url]);
        const insert = await client.query(
          "SELECT * FROM public.url WHERE url=$1",
          [url]
        );
        res.json({
          original_url: insert.rows[0].url,
          short_url: insert.rows[0].id,
        });
      }
    } catch (err) {
      next(err);
    } finally {
      await client.end();
      console.log("Database disconnected");
    }
  },
];
