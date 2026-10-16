
const express = require("express");
const path = require("path");

function createApp(pool) {
    const app = express();

    app.use(express.static(path.join(__dirname, "public")));

    // Get all products
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

    // Get a single product by ID
    app.get("/products/:id", async (req, res) => {
        const { id } = req.params;

        if (
            !/^[1-9]\d*$/.test(id) ||
            !Number.isSafeInteger(Number(id))
        ) {
            return res.status(400).json({
                error: "Invalid product ID"
            });
        }

        try {
            const [rows] = await pool.query(
                `SELECT id, name, price, stock, created_at
                 FROM products
                 WHERE id = ?`,
                [Number(id)]
            );

            if (rows.length === 0) {
                return res.status(404).json({
                    error: "Product not found"
                });
            }

            return res.json(rows[0]);
        } catch (error) {
            console.error("Database error:", error);

            return res.status(500).json({
                error: "Failed to fetch product"
            });
        }
    });

    return app;
}

module.exports = createApp;
