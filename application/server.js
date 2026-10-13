const mysql = require("mysql2/promise");
require("dotenv").config();

const createApp = require("./application");

const PORT = process.env.PORT || 3000;

// MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Create Express application
const app = createApp(pool);

// Start the server when executed directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`ShopKart server is running on port ${PORT}`);
    });
}

// Export for testing and reuse
module.exports = { app, pool };
