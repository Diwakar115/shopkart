
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

// Test 1: Retrieve all products
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

// Test 2: Handle database failure when retrieving all products
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

// Test 3: Retrieve one product by ID
test("GET /products/:id returns one product", async (t) => {
    const expectedProduct = {
        id: 1,
        name: "Test Product",
        price: 19.99,
        stock: 5,
        created_at: "2026-10-13 12:00:00"
    };

    const fakePool = {
        query: async (sql, params) => {
            assert.match(sql, /WHERE id = \?/);
            assert.deepEqual(params, [1]);
            return [[expectedProduct], []];
        }
    };

    const baseUrl = await startTestServer(t, fakePool);
    const response = await fetch(`${baseUrl}/products/1`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), expectedProduct);
});

// Test 4: Reject invalid product IDs
test("GET /products/:id returns 400 for an invalid ID", async (t) => {
    const fakePool = {
        query: async () => {
            throw new Error("Database should not be queried");
        }
    };

    const baseUrl = await startTestServer(t, fakePool);
    const response = await fetch(`${baseUrl}/products/abc`);

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
        error: "Invalid product ID"
    });
});

// Test 5: Return 404 when the product doesn't exist
test("GET /products/:id returns 404 when product does not exist", async (t) => {
    const fakePool = {
        query: async () => [[], []]
    };

    const baseUrl = await startTestServer(t, fakePool);
    const response = await fetch(`${baseUrl}/products/999999`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
        error: "Product not found"
    });
});

// Test 6: Handle database failure for a single product
test("GET /products/:id returns 500 when the database query fails", async (t) => {
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
        response = await fetch(`${baseUrl}/products/1`);
    } finally {
        console.error = originalConsoleError;
    }

    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), {
        error: "Failed to fetch product"
    });
});
