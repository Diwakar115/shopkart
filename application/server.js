const express = require("express");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.get("/", (req, res) => {
    res.send("Welcome to ShopKart!");
});

app.get("/products", (req, res) => {
    db.query("SELECT * FROM products", (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
                error: "Failed to fetch products"
            });
        }

        res.json(results);
    });
});

app.listen(3000, () => {
    console.log("ShopKart server is running on port 3000");
});
