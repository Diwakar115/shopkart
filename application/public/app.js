
const productsContainer = document.getElementById("products");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const categoryFilters = document.getElementById("categoryFilters");
const productCount = document.getElementById("productCount");
const emptyState = document.getElementById("emptyState");
const cartCount = document.getElementById("cartCount");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const cartItemsContainer = document.getElementById("cartItems");
const cartSubtotal = document.getElementById("cartSubtotal");
const drawerCount = document.getElementById("drawerCount");
const toastElement = document.getElementById("toast");

let products = [];
let selectedCategory = "all";
let toastTimer;

function readSavedCart() {
    try {
        const saved = JSON.parse(localStorage.getItem("shopkart-cart") || "{}");
        return saved && typeof saved === "object" && !Array.isArray(saved)
            ? saved
            : {};
    } catch {
        return {};
    }
}

let cart = readSavedCart();

function saveCart() {
    try {
        localStorage.setItem("shopkart-cart", JSON.stringify(cart));
    } catch {
        showToast("Your cart is available for this session.");
    }
}

function formatPrice(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function getCategory(name) {
    const value = String(name || "").toLowerCase();

    if (/phone|laptop|computer|headphone|earbud|charger|mouse|keyboard|speaker|camera|tablet|electronic|smartwatch|monitor/.test(value)) {
        return "electronics";
    }
    if (/shirt|shoe|sneaker|dress|jacket|jean|hoodie|fashion|clothing|handbag|wallet|sandal|backpack/.test(value)) {
        return "fashion";
    }
    if (/kitchen|lamp|mug|pillow|sofa|chair|blanket|cookware|home|decor|bottle|storage|bedsheet|furniture/.test(value)) {
        return "home";
    }
    if (/beauty|serum|skin|lotion|perfume|makeup|cosmetic|cream|shampoo|lipstick|skincare/.test(value)) {
        return "beauty";
    }

    return "other";
}

function getProductVisual(product) {
    const name = String(product.name || "").toLowerCase();

    const visuals = [
        [/phone|mobile/, "📱"],
        [/laptop|computer/, "💻"],
        [/headphone|earbud/, "🎧"],
        [/watch/, "⌚"],
        [/camera/, "📷"],
        [/speaker/, "🔊"],
        [/keyboard|mouse/, "⌨️"],
        [/shoe|sneaker|sandal/, "👟"],
        [/shirt|hoodie|jacket|dress|jean/, "👕"],
        [/bag|backpack|wallet/, "👜"],
        [/bottle|mug/, "☕"],
        [/lamp|light/, "💡"],
        [/pillow|blanket|bedsheet/, "🛏️"],
        [/kitchen|cookware|pan/, "🍳"],
        [/perfume/, "🧴"],
        [/beauty|serum|skin|lotion|cream|shampoo|makeup/, "✨"],
        [/book/, "📚"],
        [/plant|flower/, "🪴"],
        [/ball|sport|fitness/, "🏀"]
    ];

    const match = visuals.find(([pattern]) => pattern.test(name));
    if (match) return match[1];

    const categoryVisuals = {
        electronics: "⚡",
        fashion: "👕",
        home: "🏡",
        beauty: "✨",
        other: "✦"
    };

    return categoryVisuals[getCategory(name)] || "✦";
}

function getVisualBackground(category) {
    const backgrounds = {
        electronics: "#e7ebee",
        fashion: "#f0e5df",
        home: "#e7ede1",
        beauty: "#f1e5e8",
        other: "#eee9dc"
    };

    return backgrounds[category] || backgrounds.other;
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function showToast(message) {
    toastElement.textContent = message;
    toastElement.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toastElement.classList.remove("show");
    }, 2400);
}

async function loadProducts() {
    try {
        const response = await fetch("/products");

        if (!response.ok) {
            throw new Error(`Products request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("The products API did not return a list.");
        }

        products = data.map((product, index) => ({
            ...product,
            key: String(product.id ?? `${product.name}-${index}`),
            name: String(product.name || "Untitled product"),
            price: Math.max(0, Number(product.price) || 0),
            stock: Math.max(0, Number(product.stock) || 0)
        }));

        syncCartWithProducts();
        renderProducts();
        renderCart();
    } catch (error) {
        console.error("Unable to load ShopKart products:", error);
        productsContainer.replaceChildren();

        const message = createElement(
            "p",
            "error-message",
            "We couldn't load the products. Please refresh and try again."
        );

        productsContainer.appendChild(message);
        productCount.textContent = "Products are temporarily unavailable";
    }
}

function syncCartWithProducts() {
    for (const [key, item] of Object.entries(cart)) {
        const product = products.find(product => product.key === key);

        if (!product || product.stock <= 0) {
            delete cart[key];
            continue;
        }

        item.name = product.name;
        item.price = product.price;
        item.stock = product.stock;
        item.category = getCategory(product.name);
        item.quantity = Math.min(
            Math.max(1, Number(item.quantity) || 1),
            product.stock
        );
    }

    saveCart();
}

function getVisibleProducts() {
    const query = searchInput.value.trim().toLowerCase();

    let result = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(query);
        const matchesCategory = selectedCategory === "all" ||
            getCategory(product.name) === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    switch (sortSelect.value) {
        case "price-low":
            result.sort((a, b) => a.price - b.price);
            break;
        case "price-high":
            result.sort((a, b) => b.price - a.price);
            break;
        case "name":
            result.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    return result;
}

function createProductCard(product) {
    const category = getCategory(product.name);
    const available = product.stock > 0;

    const card = createElement("article", "product-card");
    const visual = createElement("div", "product-visual");
    visual.style.setProperty("--visual-bg", getVisualBackground(category));
    visual.setAttribute("aria-hidden", "true");

    const emoji = createElement("span", "product-emoji", getProductVisual(product));
    visual.appendChild(emoji);

    const badge = createElement(
        "span",
        "product-badge",
        !available ? "SOLD OUT" : product.stock <= 5 ? "LOW STOCK" : "A GOOD FIND"
    );
    visual.appendChild(badge);

    const details = createElement("div", "product-details");
    details.appendChild(createElement("span", "product-category", category));

    const name = createElement("h3", "", product.name);
    details.appendChild(name);

    const priceRow = createElement("div", "product-price-row");
    priceRow.appendChild(createElement("span", "price", formatPrice(product.price)));

    const stockLabel = createElement(
        "span",
        `stock-label${available ? "" : " out"}`,
        available ? `${product.stock} in stock` : "Out of stock"
    );
    priceRow.appendChild(stockLabel);
    details.appendChild(priceRow);

    const button = createElement("button", "add-button");
    button.type = "button";
    button.disabled = !available;

    const buttonText = createElement(
        "span",
        "",
        available ? "Add to bag" : "Unavailable"
    );
    const buttonIcon = createElement("span", "", available ? "+" : "–");

    button.append(buttonText, buttonIcon);
    button.addEventListener("click", () => addToCart(product.key));

    details.appendChild(button);
    card.append(visual, details);

    return card;
}

function renderProducts() {
    const visibleProducts = getVisibleProducts();
    productsContainer.replaceChildren();

    visibleProducts.forEach(product => {
        productsContainer.appendChild(createProductCard(product));
    });

    productCount.textContent =
        `${visibleProducts.length} ${visibleProducts.length === 1 ? "product" : "products"} to explore`;

    emptyState.hidden = visibleProducts.length !== 0;
    productsContainer.hidden = visibleProducts.length === 0;
}

function addToCart(key) {
    const product = products.find(item => item.key === key);
    if (!product || product.stock <= 0) {
        showToast("This item is currently unavailable.");
        return;
    }

    const existing = cart[key];

    if (existing && existing.quantity >= product.stock) {
        showToast("You've reached the available stock for this item.");
        return;
    }

    if (existing) {
        existing.quantity += 1;
    } else {
        cart[key] = {
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: getCategory(product.name),
            quantity: 1
        };
    }

    saveCart();
    renderCart();
    showToast(`${product.name} added to your bag.`);
}

function changeQuantity(key, change) {
    const item = cart[key];
    if (!item) return;

    const nextQuantity = item.quantity + change;

    if (nextQuantity <= 0) {
        delete cart[key];
    } else if (nextQuantity <= item.stock) {
        item.quantity = nextQuantity;
    } else {
        showToast("No more stock available for this item.");
        return;
    }

    saveCart();
    renderCart();
}

function renderCart() {
    cartItemsContainer.replaceChildren();

    const entries = Object.entries(cart);
    const totalItems = entries.reduce((sum, [, item]) => sum + item.quantity, 0);
    const subtotal = entries.reduce(
        (sum, [, item]) => sum + item.price * item.quantity,
        0
    );

    cartCount.textContent = totalItems > 99 ? "99+" : String(totalItems);
    drawerCount.textContent = `(${totalItems})`;
    cartSubtotal.textContent = formatPrice(subtotal);

    if (entries.length === 0) {
        const empty = createElement("div", "cart-empty");
        empty.append(
            createElement("span", "", "♡"),
            createElement("h3", "", "Your bag is taking a nap."),
            createElement("p", "", "Add something you love to get started.")
        );
        cartItemsContainer.appendChild(empty);
        return;
    }

    entries.forEach(([key, item]) => {
        const row = createElement("div", "cart-row");
        const visual = createElement("div", "cart-row-visual", getProductVisual(item));
        visual.setAttribute("aria-hidden", "true");

        const details = createElement("div", "cart-row-details");
        details.append(
            createElement("h3", "", item.name),
            createElement("p", "", formatPrice(item.price))
        );

        const quantity = createElement("div", "quantity-control");
        const decrease = createElement("button", "", "−");
        decrease.type = "button";
        decrease.setAttribute("aria-label", `Remove one ${item.name}`);
        decrease.addEventListener("click", () => changeQuantity(key, -1));

        const count = createElement("span", "", String(item.quantity));

        const increase = createElement("button", "", "+");
        increase.type = "button";
        increase.disabled = item.quantity >= item.stock;
        increase.setAttribute("aria-label", `Add one ${item.name}`);
        increase.addEventListener("click", () => changeQuantity(key, 1));

        quantity.append(decrease, count, increase);
        details.appendChild(quantity);

        const remove = createElement("button", "remove-item", "Remove");
        remove.type = "button";
        remove.addEventListener("click", () => {
            delete cart[key];
            saveCart();
            renderCart();
            showToast("Item removed from your bag.");
        });

        row.append(visual, details, remove);
        cartItemsContainer.appendChild(row);
    });
}

function setCartOpen(open) {
    cartDrawer.classList.toggle("open", open);
    cartDrawer.setAttribute("aria-hidden", String(!open));
    cartDrawer.inert = !open;
    cartOverlay.hidden = !open;
    document.body.classList.toggle("cart-open", open);
    document.getElementById("cartTrigger").setAttribute("aria-expanded", String(open));

    if (open) {
        document.getElementById("closeCart").focus();
    } else {
        document.getElementById("cartTrigger").focus();
    }
}

searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);

categoryFilters.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");
    if (!button) return;

    selectedCategory = button.dataset.category;

    categoryFilters.querySelectorAll("[data-category]").forEach(chip => {
        const active = chip === button;
        chip.classList.toggle("active", active);
        chip.setAttribute("aria-pressed", String(active));
    });

    renderProducts();
});

document.getElementById("clearFilters").addEventListener("click", () => {
    searchInput.value = "";
    selectedCategory = "all";
    sortSelect.value = "featured";

    categoryFilters.querySelectorAll("[data-category]").forEach(chip => {
        const active = chip.dataset.category === "all";
        chip.classList.toggle("active", active);
        chip.setAttribute("aria-pressed", String(active));
    });

    renderProducts();
});

document.getElementById("cartTrigger").addEventListener("click", () => setCartOpen(true));
document.getElementById("closeCart").addEventListener("click", () => setCartOpen(false));
cartOverlay.addEventListener("click", () => setCartOpen(false));

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && cartDrawer.classList.contains("open")) {
        setCartOpen(false);
    }
});

document.getElementById("checkoutButton").addEventListener("click", () => {
    if (Object.keys(cart).length === 0) {
        showToast("Your bag is empty. Find something you love first.");
        return;
    }

    showToast("Your cart works! Checkout and order processing aren't connected yet.");
});

document.getElementById("currentYear").textContent = new Date().getFullYear();

categoryFilters.querySelectorAll("[data-category]").forEach(chip => {
    chip.setAttribute("aria-pressed", String(chip.dataset.category === "all"));
});

loadProducts();
