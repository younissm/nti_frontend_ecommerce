const wishlistList = document.getElementById('wishlist-list');
const wishlistMessage = document.getElementById('wishlist-message');

document.getElementById('logout').addEventListener('click', logout);
renderWishlist();

function renderWishlist() {
    const wishlist = getWishlist();
    wishlistList.replaceChildren();

    if (wishlist.length === 0) {
        wishlistList.textContent = 'Your wishlist is empty.';
        return;
    }

    wishlist.forEach(productId => {
        const product = getProduct(productId);
        wishlistList.appendChild(makeWishlistItem(productId, product));
    });
}

function makeWishlistItem(productId, product) {
    const row = document.createElement('article');
    row.className = 'wishlist-item';

    if (product) {
        const image = document.createElement('img');
        image.src = product.image;
        image.alt = '';

        const details = document.createElement('div');
        const name = document.createElement('h2');
        name.textContent = product.name;
        const price = document.createElement('p');
        price.textContent = `$${product.price.toFixed(2)}`;
        details.append(name, price);
        row.append(image, details);
    } else {
        const unavailable = document.createElement('p');
        unavailable.textContent = 'This product is no longer available.';
        row.appendChild(unavailable);
    }

    const actions = document.createElement('div');
    actions.className = 'wishlist-item__actions';

    if (product) {
        const cartItem = getCart().find(item => item.productId === productId);
        actions.appendChild(makeQuantityControl(product, cartItem));
    }

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'projects-button projects-button-secondary';
    removeButton.textContent = 'Remove from wishlist';
    removeButton.addEventListener('click', () => removeFromWishlist(productId));
    actions.appendChild(removeButton);
    row.appendChild(actions);

    return row;
}

function makeQuantityControl(product, cartItem) {
    const quantity = cartItem ? cartItem.quantity : 0;
    const controls = document.createElement('div');
    controls.className = 'wishlist-quantity';

    const decreaseButton = document.createElement('button');
    decreaseButton.type = 'button';
    decreaseButton.className = 'projects-button projects-button-secondary';
    decreaseButton.textContent = '-';
    decreaseButton.setAttribute('aria-label', `Decrease ${product.name} cart quantity`);
    decreaseButton.disabled = quantity === 0;
    decreaseButton.addEventListener('click', () => changeQuantity(product.id, -1));

    const quantityLabel = document.createElement('span');
    quantityLabel.textContent = `In cart: ${quantity}`;
    quantityLabel.setAttribute('aria-label', `In cart: ${quantity}`);

    const increaseButton = document.createElement('button');
    increaseButton.type = 'button';
    increaseButton.className = 'projects-button';
    increaseButton.textContent = '+';
    increaseButton.setAttribute('aria-label', `Increase ${product.name} cart quantity`);
    increaseButton.disabled = product.stockQuantity <= 0;
    increaseButton.addEventListener('click', () => changeQuantity(product.id, 1));

    controls.append(decreaseButton, quantityLabel, increaseButton);
    return controls;
}

function changeQuantity(productId, amount) {
    const error = getCart().some(item => item.productId === productId)
        ? changeProductCartQuantity(productId, amount)
        : amount > 0
            ? addProductToCart(productId)
            : '';

    if (error) {
        showMessage(error);
        return;
    }

    showMessage('Cart quantity updated.');
    renderWishlist();
}

function removeFromWishlist(productId) {
    saveWishlist(getWishlist().filter(id => id !== productId));
    showMessage('Removed from wishlist.');
    renderWishlist();
}

function showMessage(message) {
    wishlistMessage.textContent = message;
    wishlistMessage.hidden = false;
}
