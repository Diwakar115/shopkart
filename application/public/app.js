let cartCount = 0;

async function loadProducts() {
    try {
        const response = await fetch("/products");
        const products = await response.json();

        const container = document.getElementById("products");

        container.innerHTML = "";

        products.forEach(product => {
            const card = document.createElement("div");

            card.className = "product-card";

            card.innerHTML = `
                <div class="product-image">🛍️</div>

                <h3>${product.name}</h3>

                <div class="price">
                    ₹${Number(product.price).toLocaleString("en-IN")}
                </div>

                <div class="stock">
                    Stock: ${product.stock}
                </div>

                <button onclick="addToCart()">
                    Add to Cart
                </button>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading products:", error);

        document.getElementById("products").innerHTML =
            "<p>Unable to load products.</p>";
    }
}

function addToCart() {
    cartCount++;

    document.getElementById("cartCount").textContent = cartCount;
}

loadProducts();
