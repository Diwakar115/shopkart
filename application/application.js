
const express = require("express");
const path = require("path");

function createApp(pool) {
    const app = express();

    app.use(express.static(path.join(__dirname, "public")));

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

    return app;
}

module.exports = createApp;
