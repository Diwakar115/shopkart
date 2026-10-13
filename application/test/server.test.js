
const test = require("node:test");
const assert = require("node:assert/strict");
const createApp = require("../application");

async function startTestServer(t, pool) {
    const server = createApp(pool).listen(0, "127.0.0.1");

    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });

    t.after(() => new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) reject(error);
            else resolve();
        });
    }));

    return `http://127.0.0.1:${server.address().port}`;
}

test("GET /products returns product rows", async (t) => {
    const expectedProducts = [
        {
            id: 1,
            name: "Test Product",
            price: 19.99,
            stock: 5,
            created_at: "2026-10-13 12:00:00"
        }
    ];

    const fakePool = {
        query: async (sql) => {
            assert.match(sql, /FROM products/);
            return [expectedProducts, []];
        }
    };

    const baseUrl = await startTestServer(t, fakePool);
    const response = await fetch(`${baseUrl}/products`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), expectedProducts);
});

test("GET /products returns HTTP 500 when the database query fails", async (t) => {
    const fakePool = {
        query: async () => {
            throw new Error("Simulated database failure");
        }
    };

    const baseUrl = await startTestServer(t, fakePool);
    const originalConsoleError = console.error;

    let response;

    try {
        console.error = () => {};
        response = await fetch(`${baseUrl}/products`);
    } finally {
        console.error = originalConsoleError;
    }

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
        error: "Failed to fetch products"
    });
});
