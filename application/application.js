
const express = require("express");
const path = require("path");
const cors = require("cors");

function createApp(pool) {
    const app = express();

    // Allow the local storefront to call the AWS API
    app.use(
        cors({
            origin: [
                "http://localhost:3000",
                "http://127.0.0.1:3000"
            ]
        })
    );

    app.use(express.json());
    app.use(express.static(path.join(__dirname, "public")));

    // Get all products with complete product details
    app.get("/products", async (req, res) => {
        try {
            const [rows] = await pool.query(`
                SELECT
                    id,
                    name,
                    price,
                    stock,
                    created_at,
                    category,
                    brand,
                    description,
                    image_url,
                    discount_percent,
                    rating,
                    review_count
                FROM products
                ORDER BY id ASC
            `);

            return res.json(rows);
        } catch (error) {
            console.error("Database error:", error);

            return res.status(500).json({
                error: "Failed to fetch products"
            });
        }
    });

    // Get one product by ID
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
                `SELECT
                    id,
                    name,
                    price,
                    stock,
                    created_at,
                    category,
                    brand,
                    description,
                    image_url,
                    discount_percent,
                    rating,
                    review_count
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
