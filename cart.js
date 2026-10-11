const cartContainer = document.getElementById('cart-container');
const cartMessage = document.getElementById('cart-error');
const orderMessage = document.getElementById('order-message');

init();

function init() {
    const logoutButton = document.getElementById('logout');
    logoutButton.addEventListener('click', logout);
    renderCart();
}

function renderCart() {
    const cart = getCart();
    let total = 0;
    let hasUnavailableItems = false;

    cartContainer.replaceChildren();
    cartMessage.textContent = '';
    orderMessage.hidden = true;
    orderMessage.textContent = '';

    if (cart.length === 0) {
        cartMessage.textContent = 'Your cart is empty.';
        return;
    }

    cart.forEach(item => {
        const product = getProduct(item.productId);

        if (!product) {
            hasUnavailableItems = true;
            cartContainer.appendChild(makeUnavailableItem(item));
            return;
        }

        total += product.price * item.quantity;
        cartContainer.appendChild(makeCartItem(item, product));
    });

    const totalLine = document.createElement('p');
    totalLine.textContent = `Total: $${total.toFixed(2)}`;
    cartContainer.appendChild(totalLine);

    const checkoutButton = makeButton('Place order', placeOrder);
    checkoutButton.classList.add('checkout-button');
    checkoutButton.disabled = hasUnavailableItems;
    cartContainer.appendChild(checkoutButton);

    if (hasUnavailableItems) {
        cartMessage.textContent = 'Some products are no longer available. Remove them from your cart.';
    }
}

function makeCartItem(item, product) {
    const row = document.createElement('article');
    row.className = 'cart-item';

    const name = document.createElement('h2');
    name.textContent = product.name;

    const price = document.createElement('p');
    price.textContent = `$${product.price.toFixed(2)} each`;

    const subtotal = document.createElement('p');
    subtotal.textContent = `Subtotal: $${(product.price * item.quantity).toFixed(2)}`;

    const quantityControls = document.createElement('div');
    quantityControls.className = 'cart-quantity';

    const decreaseButton = makeButton('-', () => changeQuantity(product.id, -1));
    decreaseButton.setAttribute('aria-label', `Decrease ${product.name} quantity`);

    const quantity = document.createElement('span');
    quantity.textContent = item.quantity;
    quantity.setAttribute('aria-label', 'Quantity');

    const increaseButton = makeButton('+', () => changeQuantity(product.id, 1));
    increaseButton.setAttribute('aria-label', `Increase ${product.name} quantity`);
    increaseButton.disabled = product.stockQuantity <= 0;
    if (increaseButton.disabled) {
        increaseButton.title = 'No more stock is available.';
    }

    const removeButton = makeButton('Remove', () => removeFromCart(product.id));

    quantityControls.append(decreaseButton, quantity, increaseButton);
    row.append(name, price, quantityControls, subtotal, removeButton);

    return row;
}

function makeUnavailableItem(item) {
    const row = document.createElement('article');
    row.className = 'cart-item';

    const message = document.createElement('p');
    message.textContent = 'This product is no longer available.';

    const removeButton = makeButton('Remove', () => removeFromCart(item.productId));
    row.append(message, removeButton);
    return row;
}

function makeButton(label, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'projects-button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

function changeQuantity(productId, amount) {
    changeProductCartQuantity(productId, amount);
    renderCart();
}

function removeFromCart(productId) {
    removeProductFromCart(productId);
    renderCart();
}

function placeOrder() {
    const cart = getCart();
    const customer = getCurrentUser();

    if (cart.length === 0) {
        showOrderMessage('Your cart is empty.');
        return;
    }

    const items = [];
    for (const item of cart) {
        const product = getProduct(item.productId);
        if (!product) {
            showOrderMessage('Some products are no longer available. Remove them before placing your order.');
            return;
        }

        items.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity
        });
    }

    const now = new Date().toISOString();
    const order = {
        id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        customer: {
            name: customer.name,
            email: customer.email
        },
        items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        status: 'pending',
        paymentStatus: 'unpaid',
        createdAt: now,
        updatedAt: now
    };

    saveOrders([...getOrders(), order]);
    saveCart([]);
    renderCart();
    showOrderMessage('Order placed. It is pending admin confirmation.');
}

function showOrderMessage(message) {
    orderMessage.textContent = message;
    orderMessage.hidden = false;
}
