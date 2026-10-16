
/* =========================================================
   SHOPKART — COBALT & LIME
   Frontend product catalog, search, filters and cart
   ========================================================= */

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

/* -------------------- CART STORAGE -------------------- */

function readSavedCart() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("shopkart-cart") || "{}"
        );

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

/* -------------------- HELPERS -------------------- */

function formatPrice(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

function showToast(message) {
    if (!toastElement) return;

    toastElement.textContent = message;
    toastElement.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toastElement.classList.remove("show");
    }, 2400);
}

/*
 * Maps database categories to the existing frontend filter values:
 * all, electronics, fashion, home, beauty, other.
 */
function getCategory(productOrName) {
    const rawCategory =
        typeof productOrName === "object" && productOrName !== null
            ? productOrName.category
            : "";

    const name =
        typeof productOrName === "object" && productOrName !== null
            ? productOrName.name
            : productOrName;

    const category = String(rawCategory || "").toLowerCase().trim();
    const value = String(name || "").toLowerCase();

    if (category) {
        if (/electronic|computer|mobile|phone|gadget/.test(category)) {
            return "electronics";
        }

        if (/fashion|footwear|clothing|apparel|accessor/.test(category)) {
            return "fashion";
        }

        if (/home|kitchen|furniture|decor/.test(category)) {
            return "home";
        }

        if (/beauty|personal care|cosmetic|skincare/.test(category)) {
            return "beauty";
        }

        if (/general/.test(category)) {
            return getCategoryFromName(value);
        }

        return "other";
    }

    return getCategoryFromName(value);
}

function getCategoryFromName(value) {
    if (
        /phone|laptop|computer|headphone|earbud|charger|mouse|keyboard|speaker|camera|tablet|electronic|smartwatch|monitor|power bank|printer/.test(value)
    ) {
        return "electronics";
    }

    if (
        /shirt|shoe|sneaker|dress|jacket|jean|hoodie|fashion|clothing|handbag|wallet|sandal|backpack|footwear|trouser|kurta|saree|t-shirt/.test(value)
    ) {
        return "fashion";
    }

    if (
        /kitchen|lamp|mug|pillow|sofa|chair|blanket|cookware|home|decor|bottle|storage|bedsheet|furniture|pan|curtain/.test(value)
    ) {
        return "home";
    }

    if (
        /beauty|serum|skin|lotion|perfume|makeup|cosmetic|cream|shampoo|lipstick|skincare/.test(value)
    ) {
        return "beauty";
    }

    return "other";
}

function getProductVisual(product) {
    const name = String(product.name || "").toLowerCase();

    const visuals = [
        [/phone|mobile|tablet/, "📱"],
        [/laptop|computer|monitor/, "💻"],
        [/headphone|earbud/, "🎧"],
        [/watch/, "⌚"],
        [/camera/, "📷"],
        [/speaker/, "🔊"],
        [/keyboard|mouse/, "⌨️"],
        [/shoe|sneaker|sandal/, "👟"],
        [/shirt|hoodie|jacket|dress|jean|kurta/, "👕"],
        [/bag|backpack|wallet/, "👜"],
        [/bottle|mug/, "☕"],
        [/lamp|light/, "💡"],
        [/pillow|blanket|bedsheet/, "🛏️"],
        [/kitchen|cookware|pan/, "🍳"],
        [/perfume|shampoo|lotion/, "🧴"],
        [/beauty|serum|skin|cream|makeup/, "✨"],
        [/book/, "📚"],
        [/plant|flower/, "🪴"],
        [/ball|sport|fitness/, "🏀"],
        [/toy|kids|baby/, "🧸"]
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

    return categoryVisuals[getCategory(product)] || "✦";
}

function getVisualBackground(category) {
    const backgrounds = {
        electronics: "#EEF2FF",
        fashion: "#F2F0FF",
        home: "#EFF8E8",
        beauty: "#FFF0F5",
        other: "#F1F5F9"
    };

    return backgrounds[category] || backgrounds.other;
}

function getImageUrl(product) {
    const url = String(product.image_url || "").trim();

    // Only use normal web image URLs.
    if (/^https?:\/\//i.test(url)) return url;

    return "";
}

function getRating(product) {
    const rating = Number(product.rating);

    if (!Number.isFinite(rating) || rating <= 0) return null;

    return Math.min(5, Math.max(0, rating));
}

/* -------------------- LOAD PRODUCTS -------------------- */

async function loadProducts() {
    try {
        productCount.textContent = "Loading products…";

        const response = await fetch("/products", {
            headers: { Accept: "application/json" }
        });

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
            brand: String(product.brand || ""),
            category: String(product.category || ""),
            description: String(product.description || ""),
            image_url: String(product.image_url || ""),
            price: Math.max(0, Number(product.price) || 0),
            stock: Math.max(0, Number(product.stock) || 0),
            discount_percent: Math.min(
                100,
                Math.max(0, Number(product.discount_percent) || 0)
            ),
            rating: Number(product.rating) || 0,
            review_count: Math.max(0, Number(product.review_count) || 0)
        }));

        syncCartWithProducts();
        renderProducts();
        renderCart();

        console.info(`ShopKart loaded ${products.length} products.`);
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
        emptyState.hidden = true;
    }
}

/* -------------------- SEARCH, FILTER AND SORT -------------------- */

function getVisibleProducts() {
    const query = searchInput.value.trim().toLowerCase();

    let result = products.filter(product => {
        const searchableText = [
            product.name,
            product.brand,
            product.category,
            product.description
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(query);

        const matchesCategory =
            selectedCategory === "all" ||
            getCategory(product) === selectedCategory;

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

        case "featured":
        default:
            // Preserve the API's product order.
            break;
    }

    return result;
}

/* -------------------- PRODUCT CARD -------------------- */

function createProductCard(product) {
    const category = getCategory(product);
    const available = product.stock > 0;
    const imageUrl = getImageUrl(product);
    const rating = getRating(product);
    const discount = product.discount_percent;

    const card = createElement("article", "product-card");

    const visual = createElement("div", "product-visual");
    visual.style.setProperty("--visual-bg", getVisualBackground(category));

    if (imageUrl) {
        const image = createElement("img", "product-image");

        image.src = imageUrl;
        image.alt = product.name;
        image.loading = "lazy";
        image.decoding = "async";

        image.addEventListener("error", () => {
            image.remove();

            const fallback = createElement(
                "span",
                "product-emoji",
                getProductVisual(product)
            );

            fallback.setAttribute("aria-label", product.name);
            visual.prepend(fallback);
        }, { once: true });

        visual.appendChild(image);
    } else {
        const fallback = createElement(
            "span",
            "product-emoji",
            getProductVisual(product)
        );

        fallback.setAttribute("aria-label", product.name);
        visual.appendChild(fallback);
    }

    const badgeText = !available
        ? "SOLD OUT"
        : discount > 0
            ? `${discount}% OFF`
            : product.stock <= 5
                ? "LOW STOCK"
                : "FEATURED";

    const badge = createElement("span", "product-badge", badgeText);
    visual.appendChild(badge);

    const details = createElement("div", "product-details");

    details.appendChild(
        createElement(
            "span",
            "product-category",
            product.category || category
        )
    );

    if (product.brand) {
        details.appendChild(
            createElement("p", "product-brand", product.brand)
        );
    }

    const name = createElement("h3", "product-name", product.name);
    details.appendChild(name);

    if (product.description) {
        const description = createElement(
            "p",
            "product-description",
            product.description
        );

        details.appendChild(description);
    }

    if (rating !== null) {
        const ratingRow = createElement("div", "product-rating");

        const stars = createElement(
            "span",
            "rating-stars",
            "★".repeat(Math.round(rating)) +
                "☆".repeat(5 - Math.round(rating))
        );

        const ratingText = createElement(
            "span",
            "rating-value",
            rating.toFixed(1)
        );

        ratingRow.append(stars, ratingText);

        if (product.review_count > 0) {
            ratingRow.appendChild(
                createElement(
                    "span",
                    "review-count",
                    `(${product.review_count.toLocaleString("en-IN")})`
                )
            );
        }

        details.appendChild(ratingRow);
    }

    const priceRow = createElement("div", "product-price-row");

    const price = createElement("span", "price", formatPrice(product.price));
    priceRow.appendChild(price);

    if (discount > 0) {
        const originalPrice = product.price / (1 - discount / 100);

        priceRow.appendChild(
            createElement(
                "span",
                "original-price",
                formatPrice(originalPrice)
            )
        );
    }

    details.appendChild(priceRow);

    const stockLabel = createElement(
        "span",
        `stock-label${available ? "" : " out"}`,
        available
            ? product.stock <= 5
                ? `Only ${product.stock} left`
                : "In stock"
            : "Out of stock"
    );

    details.appendChild(stockLabel);

    const button = createElement("button", "add-button");
    button.type = "button";
    button.disabled = !available;

    button.append(
        createElement(
            "span",
            "",
            available ? "Add to cart" : "Unavailable"
        ),
        createElement("span", "", available ? "+" : "–")
    );

    button.addEventListener("click", () => addToCart(product.key));

    details.appendChild(button);
    card.append(visual, details);

    return card;
}

/* -------------------- RENDER CATALOG -------------------- */

function renderProducts() {
    const visibleProducts = getVisibleProducts();
    const fragment = document.createDocumentFragment();

    visibleProducts.forEach(product => {
        fragment.appendChild(createProductCard(product));
    });

    productsContainer.replaceChildren(fragment);

    productCount.textContent =
        `${visibleProducts.length.toLocaleString("en-IN")} ` +
        `${visibleProducts.length === 1 ? "product" : "products"} to explore`;

    emptyState.hidden = visibleProducts.length !== 0;
    productsContainer.hidden = visibleProducts.length === 0;
}

/* -------------------- CART OPERATIONS -------------------- */

function syncCartWithProducts() {
    for (const [key, item] of Object.entries(cart)) {
        const product = products.find(itemProduct => itemProduct.key === key);

        if (!product || product.stock <= 0) {
            delete cart[key];
            continue;
        }

        item.name = product.name;
        item.price = product.price;
        item.stock = product.stock;
        item.category = getCategory(product);
        item.image_url = product.image_url || "";
        item.quantity = Math.min(
            Math.max(1, Number(item.quantity) || 1),
            product.stock
        );
    }

    saveCart();
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
            category: getCategory(product),
            image_url: product.image_url || "",
            quantity: 1
        };
    }

    saveCart();
    renderCart();
    showToast(`${product.name} added to your cart.`);
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

/* -------------------- RENDER CART -------------------- */

function renderCart() {
    cartItemsContainer.replaceChildren();

    const entries = Object.entries(cart);

    const totalItems = entries.reduce(
        (sum, [, item]) => sum + item.quantity,
        0
    );

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
            createElement("h3", "", "Your cart is empty"),
            createElement("p", "", "Find something you'll love.")
        );

        cartItemsContainer.appendChild(empty);
        return;
    }

    entries.forEach(([key, item]) => {
        const row = createElement("div", "cart-row");
        const visual = createElement("div", "cart-row-visual");

        const imageUrl = getImageUrl(item);

        if (imageUrl) {
            const image = createElement("img", "cart-product-image");

            image.src = imageUrl;
            image.alt = item.name;
            image.loading = "lazy";

            image.addEventListener("error", () => {
                image.replaceWith(
                    createElement(
                        "span",
                        "",
                        getProductVisual(item)
                    )
                );
            }, { once: true });

            visual.appendChild(image);
        } else {
            visual.appendChild(
                createElement("span", "", getProductVisual(item))
            );
        }

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
            showToast("Item removed from your cart.");
        });

        row.append(visual, details, remove);
        cartItemsContainer.appendChild(row);
    });
}

/* -------------------- CART DRAWER -------------------- */

function setCartOpen(open) {
    cartDrawer.classList.toggle("open", open);
    cartDrawer.setAttribute("aria-hidden", String(!open));
    cartDrawer.inert = !open;

    cartOverlay.hidden = !open;
    document.body.classList.toggle("cart-open", open);

    const trigger = document.getElementById("cartTrigger");
    const closeButton = document.getElementById("closeCart");

    trigger.setAttribute("aria-expanded", String(open));

    if (open) {
        closeButton.focus();
    } else {
        trigger.focus();
    }
}

/* -------------------- EVENT LISTENERS -------------------- */

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

document.getElementById("cartTrigger").addEventListener("click", () => {
    setCartOpen(true);
});

document.getElementById("closeCart").addEventListener("click", () => {
    setCartOpen(false);
});

cartOverlay.addEventListener("click", () => setCartOpen(false));

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && cartDrawer.classList.contains("open")) {
        setCartOpen(false);
    }
});

document.getElementById("checkoutButton").addEventListener("click", () => {
    if (Object.keys(cart).length === 0) {
        showToast("Your cart is empty. Add a product first.");
        return;
    }

    showToast(
        "Your cart is ready! Payment and order processing still need to be connected."
    );
});

document.getElementById("currentYear").textContent =
    new Date().getFullYear();

categoryFilters.querySelectorAll("[data-category]").forEach(chip => {
    chip.setAttribute(
        "aria-pressed",
        String(chip.dataset.category === "all")
    );
});

/* -------------------- START APPLICATION -------------------- */

loadProducts();
