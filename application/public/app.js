
"use strict";

// ============================================
// ShopKart - Storefront
// Plum & Coral marketplace
// ============================================

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

// ============================================
// Cart persistence
// ============================================

function readSavedCart() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("shopkart-cart") || "{}"
        );

        return saved &&
            typeof saved === "object" &&
            !Array.isArray(saved)
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

// ============================================
// Helpers
// ============================================

function formatPrice(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2
    });
}

function getProductCategory(product) {
    return String(product.category || "General").trim() || "General";
}

function getCategoryKey(category) {
    return String(category || "General").trim().toLowerCase();
}

function getDiscountedPrice(product) {
    const price = Number(product.price) || 0;
    const discount = Math.min(
        100,
        Math.max(0, Number(product.discount_percent) || 0)
    );

    return price * (1 - discount / 100);
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

function getProductVisual(product) {
    const text = [
        product.name,
        product.category,
        product.brand
    ].join(" ").toLowerCase();

    const visuals = [
        [/phone|mobile|tablet/, "📱"],
        [/laptop|computer|monitor/, "💻"],
        [/headphone|earbud/, "🎧"],
        [/watch/, "⌚"],
        [/camera|webcam/, "📷"],
        [/speaker/, "🔊"],
        [/keyboard|mouse/, "⌨️"],
        [/shoe|sneaker|sandal|boot/, "👟"],
        [/shirt|hoodie|jacket|dress|jean|kurti|trouser/, "👕"],
        [/bag|backpack|wallet|purse/, "👜"],
        [/bottle|mug/, "🥤"],
        [/lamp|light|clock/, "💡"],
        [/pillow|blanket|bedsheet|cushion/, "🛏️"],
        [/kitchen|cookware|pan|container/, "🍳"],
        [/beauty|serum|skin|lotion|cream|shampoo|makeup/, "✨"],
        [/book|puzzle|toy|blocks/, "🎁"],
        [/football|cricket|sport|fitness|yoga|dumbbell/, "🏀"],
        [/sunglasses|belt|cap|accessories/, "🕶️"]
    ];

    const match = visuals.find(([pattern]) => pattern.test(text));

    return match ? match[1] : "✦";
}

function getVisualBackground(category) {
    const key = getCategoryKey(category);

    if (key.includes("electronic")) return "#e7ebee";
    if (key.includes("fashion")) return "#f0e5df";
    if (key.includes("footwear")) return "#e9e5f0";
    if (key.includes("beauty")) return "#f1e5e8";
    if (key.includes("home")) return "#e7ede1";
    if (key.includes("sport")) return "#e2eee7";
    if (key.includes("kid")) return "#fff0d8";
    if (key.includes("accessor")) return "#eee9dc";

    return "#FFF4E8";
}

function setStyles(element, styles) {
    Object.assign(element.style, styles);
}

// ============================================
// Load products from the API
// ============================================

async function loadProducts() {
    try {
        const response = await fetch("http://a0b0cd8d216574342ae892cbf875d0f0-652082297.us-east-1.elb.amazonaws.com/products");

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
            category: String(product.category || "General"),
            brand: String(product.brand || ""),
            description: String(product.description || ""),
            image_url: String(product.image_url || ""),
            price: Math.max(0, Number(product.price) || 0),
            stock: Math.max(0, Number(product.stock) || 0),
            discount_percent: Math.min(
                100,
                Math.max(0, Number(product.discount_percent) || 0)
            ),
            rating: Math.max(0, Math.min(
                5,
                Number(product.rating) || 0
            )),
            review_count: Math.max(
                0,
                Number(product.review_count) || 0
            )
        }));

        renderCategoryFilters();
        syncCartWithProducts();
        renderProducts();
        renderCart();
    } catch (error) {
        console.error("Unable to load ShopKart products:", error);

        productsContainer.replaceChildren();

        productsContainer.appendChild(
            createElement(
                "p",
                "error-message",
                "We couldn't load the products. Please refresh and try again."
            )
        );

        productCount.textContent = "Products are temporarily unavailable";
    }
}

// ============================================
// Dynamic category filters
// ============================================

function renderCategoryFilters() {
    const categories = [
        ...new Set(products.map(product => getProductCategory(product)))
    ].sort((a, b) => a.localeCompare(b));

    const availableKeys = new Set(
        categories.map(getCategoryKey)
    );

    if (
        selectedCategory !== "all" &&
        !availableKeys.has(selectedCategory)
    ) {
        selectedCategory = "all";
    }

    categoryFilters.replaceChildren();

    const filters = [
        { label: "Everything", value: "all" },
        ...categories.map(category => ({
            label: category,
            value: getCategoryKey(category)
        }))
    ];

    filters.forEach(filter => {
        const button = createElement(
            "button",
            "category-chip",
            filter.label
        );

        button.type = "button";
        button.dataset.category = filter.value;

        const active = filter.value === selectedCategory;

        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));

        categoryFilters.appendChild(button);
    });
}

// ============================================
// Cart synchronization
// ============================================

function syncCartWithProducts() {
    for (const [key, item] of Object.entries(cart)) {
        const product = products.find(item => item.key === key);

        if (!product || product.stock <= 0) {
            delete cart[key];
            continue;
        }

        item.name = product.name;
        item.price = product.price;
        item.stock = product.stock;
        item.category = product.category;
        item.quantity = Math.min(
            Math.max(1, Number(item.quantity) || 1),
            product.stock
        );
    }

    saveCart();
}

// ============================================
// Search, category filtering and sorting
// ============================================

function getVisibleProducts() {
    const query = searchInput.value.trim().toLowerCase();

    const result = products.filter(product => {
        const searchableText = [
            product.name,
            product.category,
            product.brand,
            product.description
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(query);

        const matchesCategory =
            selectedCategory === "all" ||
            getCategoryKey(product.category) === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    switch (sortSelect.value) {
        case "price-low":
            result.sort(
                (a, b) => getDiscountedPrice(a) - getDiscountedPrice(b)
            );
            break;

        case "price-high":
            result.sort(
                (a, b) => getDiscountedPrice(b) - getDiscountedPrice(a)
            );
            break;

        case "name":
            result.sort((a, b) => a.name.localeCompare(b.name));
            break;

        default:
            // Preserve API order for featured products.
            break;
    }

    return result;
}

// ============================================
// Product images
// ============================================

function createProductImage(product, category) {
    const visual = createElement("div", "product-visual");

    setStyles(visual, {
        position: "relative",
        overflow: "hidden",
        background: getVisualBackground(category),
        minHeight: "190px"
    });

    const imageUrl = product.image_url.trim();

    if (imageUrl) {
        const image = createElement("img", "product-image");

        image.src = imageUrl;
        image.alt = product.name;
        image.loading = "lazy";
        image.decoding = "async";

        setStyles(image, {
            display: "block",
            width: "100%",
            height: "220px",
            objectFit: "contain",
            padding: "12px",
            boxSizing: "border-box"
        });

        image.addEventListener("error", () => {
            image.remove();

            const fallback = createElement(
                "span",
                "product-emoji",
                getProductVisual(product)
            );

            setStyles(fallback, {
                fontSize: "64px",
                display: "grid",
                placeItems: "center",
                minHeight: "190px"
            });

            visual.prepend(fallback);
        }, { once: true });

        visual.appendChild(image);
    } else {
        const emoji = createElement(
            "span",
            "product-emoji",
            getProductVisual(product)
        );

        setStyles(emoji, {
            fontSize: "64px",
            display: "grid",
            placeItems: "center",
            minHeight: "190px"
        });

        visual.appendChild(emoji);
    }

    const badgeText = product.stock <= 0
        ? "SOLD OUT"
        : product.discount_percent > 0
            ? `${product.discount_percent}% OFF`
            : product.stock <= 5
                ? "LOW STOCK"
                : "A GOOD FIND";

    const badge = createElement("span", "product-badge", badgeText);

    if (product.discount_percent > 0 && product.stock > 0) {
        badge.style.background = "#FF6B61";
        badge.style.color = "#48233C";
    }

    visual.appendChild(badge);

    return visual;
}

// ============================================
// Product cards
// ============================================

function createProductCard(product) {
    const category = getProductCategory(product);
    const available = product.stock > 0;
    const discountedPrice = getDiscountedPrice(product);
    const hasDiscount = product.discount_percent > 0;

    const card = createElement("article", "product-card");

    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute(
        "aria-label",
        `View details for ${product.name}`
    );

    card.style.cursor = "pointer";

    const visual = createProductImage(product, category);

    const details = createElement("div", "product-details");

    details.appendChild(
        createElement("span", "product-category", category)
    );

    if (product.brand) {
        details.appendChild(
            createElement("span", "product-brand", product.brand)
        );
    }

    details.appendChild(
        createElement("h3", "", product.name)
    );

    if (product.rating > 0) {
        const rating = createElement("div", "product-rating");

        rating.textContent =
            `★ ${product.rating.toFixed(1)}` +
            (product.review_count > 0
                ? ` (${product.review_count.toLocaleString("en-IN")})`
                : "");

        setStyles(rating, {
            color: "#8a6330",
            fontSize: "13px",
            margin: "6px 0"
        });

        details.appendChild(rating);
    }

    const priceRow = createElement("div", "product-price-row");

    const prices = createElement("div", "product-prices");

    prices.appendChild(
        createElement(
            "span",
            "price",
            formatPrice(discountedPrice)
        )
    );

    if (hasDiscount) {
        const originalPrice = createElement(
            "span",
            "original-price",
            formatPrice(product.price)
        );

        originalPrice.style.textDecoration = "line-through";
        originalPrice.style.opacity = "0.65";
        originalPrice.style.marginLeft = "8px";

        prices.appendChild(originalPrice);
    }

    priceRow.appendChild(prices);

    const stockLabel = createElement(
        "span",
        `stock-label${available ? "" : " out"}`,
        available
            ? product.stock <= 5
                ? "Low stock"
                : "In stock"
            : "Out of stock"
    );

    priceRow.appendChild(stockLabel);
    details.appendChild(priceRow);

    const button = createElement("button", "add-button");
    button.type = "button";
    button.disabled = !available;

    button.append(
        createElement(
            "span",
            "",
            available ? "Add to bag" : "Unavailable"
        ),
        createElement("span", "", available ? "+" : "–")
    );

    button.addEventListener("click", event => {
        event.stopPropagation();
        addToCart(product.key);
    });

    details.appendChild(button);
    card.append(visual, details);

    card.addEventListener("click", () => openProductDetails(product));

    card.addEventListener("keydown", event => {
        if (event.target !== card) return;

        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openProductDetails(product);
        }
    });

    return card;
}

function renderProducts() {
    const visibleProducts = getVisibleProducts();

    productsContainer.replaceChildren();

    visibleProducts.forEach(product => {
        productsContainer.appendChild(createProductCard(product));
    });

    productCount.textContent =
        `${visibleProducts.length} ` +
        `${visibleProducts.length === 1 ? "product" : "products"} to explore`;

    emptyState.hidden = visibleProducts.length !== 0;
    productsContainer.hidden = visibleProducts.length === 0;
}

// ============================================
// Product details dialog
// ============================================

let productDialog;
let previousFocus;

function ensureProductDialog() {
    if (productDialog) return productDialog;

    productDialog = createElement("div", "product-dialog-overlay");

    setStyles(productDialog, {
        position: "fixed",
        inset: "0",
        zIndex: "1200",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(24, 18, 23, 0.65)"
    });

    const panel = createElement("section", "product-dialog");

    setStyles(panel, {
        position: "relative",
        width: "min(900px, 100%)",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#FFF4E8",
        color: "#48233C",
        borderRadius: "18px",
        padding: "24px",
        boxSizing: "border-box",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25)"
    });

    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", "Product details");

    const close = createElement("button", "icon-button", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close product details");

    setStyles(close, {
        position: "absolute",
        right: "14px",
        top: "10px",
        fontSize: "28px",
        zIndex: "1"
    });

    const content = createElement("div", "product-dialog-content");

    setStyles(content, {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
        gap: "24px",
        alignItems: "start",
        paddingTop: "20px"
    });

    close.addEventListener("click", closeProductDetails);

    productDialog.addEventListener("click", event => {
        if (event.target === productDialog) {
            closeProductDetails();
        }
    });

    panel.append(close, content);
    productDialog.appendChild(panel);
    document.body.appendChild(productDialog);

    productDialog._content = content;
    productDialog._panel = panel;

    return productDialog;
}

function openProductDetails(product) {
    const dialog = ensureProductDialog();
    const content = dialog._content;

    content.replaceChildren();

    const imageBox = createElement("div", "product-detail-image");

    setStyles(imageBox, {
        minHeight: "280px",
        background: getVisualBackground(product.category),
        borderRadius: "12px",
        overflow: "hidden",
        display: "grid",
        placeItems: "center"
    });

    if (product.image_url) {
        const image = createElement("img", "", "");

        image.src = product.image_url;
        image.alt = product.name;

        setStyles(image, {
            width: "100%",
            height: "300px",
            objectFit: "contain",
            padding: "12px",
            boxSizing: "border-box"
        });

        image.addEventListener("error", () => {
            image.replaceWith(
                createElement("span", "", getProductVisual(product))
            );
        }, { once: true });

        imageBox.appendChild(image);
    } else {
        const emoji = createElement(
            "span",
            "",
            getProductVisual(product)
        );

        setStyles(emoji, { fontSize: "80px" });
        imageBox.appendChild(emoji);
    }

    const info = createElement("div", "product-detail-info");

    info.appendChild(
        createElement("p", "product-category", product.category)
    );

    if (product.brand) {
        info.appendChild(
            createElement("p", "product-brand", `Brand: ${product.brand}`)
        );
    }

    const title = createElement("h2", "", product.name);

    setStyles(title, {
        fontSize: "clamp(22px, 4vw, 32px)",
        lineHeight: "1.25",
        margin: "8px 0 12px"
    });

    info.appendChild(title);

    if (product.rating > 0) {
        info.appendChild(
            createElement(
                "p",
                "product-rating",
                `★ ${product.rating.toFixed(1)} / 5` +
                (product.review_count
                    ? ` · ${product.review_count} reviews`
                    : "")
            )
        );
    }

    const currentPrice = createElement(
        "strong",
        "price",
        formatPrice(getDiscountedPrice(product))
    );

    setStyles(currentPrice, {
        fontSize: "26px",
        display: "inline-block",
        margin: "10px 0"
    });

    info.appendChild(currentPrice);

    if (product.discount_percent > 0) {
        const discountInfo = createElement(
            "p",
            "",
            `${product.discount_percent}% off · MRP ${formatPrice(product.price)}`
        );

        setStyles(discountInfo, {
            color: "#9b4b40",
            margin: "0 0 12px"
        });

        info.appendChild(discountInfo);
    }

    const stockInfo = createElement(
        "p",
        "",
        product.stock > 0
            ? `${product.stock} available`
            : "Currently out of stock"
    );

    info.appendChild(stockInfo);

    info.appendChild(
        createElement(
            "p",
            "product-description",
            product.description || "Product details will be available soon."
        )
    );

    const addButton = createElement(
        "button",
        "add-button",
        product.stock > 0 ? "Add to bag +" : "Unavailable"
    );

    addButton.type = "button";
    addButton.disabled = product.stock <= 0;

    addButton.addEventListener("click", () => {
        addToCart(product.key);
    });

    info.appendChild(addButton);

    content.append(imageBox, info);

    previousFocus = document.activeElement;
    dialog.style.display = "flex";
    document.body.style.overflow = "hidden";

    dialog.querySelector("button").focus();
}

function closeProductDetails() {
    if (!productDialog) return;

    productDialog.style.display = "none";
    document.body.style.overflow = "";

    if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
    }
}

// ============================================
// Shopping cart actions
// ============================================

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
            category: product.category,
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
            createElement("h3", "", "Your bag is taking a nap."),
            createElement("p", "", "Add something you love to get started.")
        );

        cartItemsContainer.appendChild(empty);
        return;
    }

    entries.forEach(([key, item]) => {
        const row = createElement("div", "cart-row");

        const visual = createElement(
            "div",
            "cart-row-visual",
            getProductVisual(item)
        );

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

// ============================================
// Cart drawer
// ============================================

function setCartOpen(open) {
    cartDrawer.classList.toggle("open", open);
    cartDrawer.setAttribute("aria-hidden", String(!open));
    cartDrawer.inert = !open;
    cartOverlay.hidden = !open;

    document.body.classList.toggle("cart-open", open);

    document.getElementById("cartTrigger")
        .setAttribute("aria-expanded", String(open));

    if (open) {
        document.getElementById("closeCart").focus();
    } else {
        document.getElementById("cartTrigger").focus();
    }
}

// ============================================
// Event listeners
// ============================================

searchInput.addEventListener("input", renderProducts);
sortSelect.addEventListener("change", renderProducts);

categoryFilters.addEventListener("click", event => {
    const button = event.target.closest("[data-category]");

    if (!button) return;

    selectedCategory = button.dataset.category || "all";

    categoryFilters.querySelectorAll("[data-category]").forEach(chip => {
        const active = chip.dataset.category === selectedCategory;

        chip.classList.toggle("active", active);
        chip.setAttribute("aria-pressed", String(active));
    });

    renderProducts();
});

document.getElementById("clearFilters").addEventListener("click", () => {
    searchInput.value = "";
    selectedCategory = "all";
    sortSelect.value = "featured";

    renderCategoryFilters();
    renderProducts();
});

document.getElementById("cartTrigger")
    .addEventListener("click", () => setCartOpen(true));

document.getElementById("closeCart")
    .addEventListener("click", () => setCartOpen(false));

cartOverlay.addEventListener("click", () => setCartOpen(false));

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        if (productDialog && productDialog.style.display === "flex") {
            closeProductDetails();
        } else if (cartDrawer.classList.contains("open")) {
            setCartOpen(false);
        }
    }
});

document.getElementById("checkoutButton").addEventListener("click", () => {
    if (Object.keys(cart).length === 0) {
        showToast("Your bag is empty. Find something you love first.");
        return;
    }

    showToast(
        "Your cart works! Secure checkout and order processing are next."
    );
});

document.getElementById("currentYear").textContent =
    new Date().getFullYear();

// ============================================
// Start the storefront
// ============================================

loadProducts();
