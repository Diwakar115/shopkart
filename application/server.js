const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Products API
app.get("/products", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, name, price, stock, created_at FROM products"
        );

        res.json(rows);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({
            error: "Failed to fetch products"
        });
    }
});

app.listen(PORT, () => {
    console.log(`ShopKart server is running on port ${PORT}`);
});
