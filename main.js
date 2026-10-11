class DataStore {
    get(key, defaultValue = null) {
        throw new Error('DataStore.get() must be implemented.');
    }

    set(key, value) {
        throw new Error('DataStore.set() must be implemented.');
    }

    remove(key) {
        throw new Error('DataStore.remove() must be implemented.');
    }
}

class LocalStorageDataStore extends DataStore {
    get(key, defaultValue = null) {
        const savedValue = localStorage.getItem(key);
        return savedValue === null ? defaultValue : JSON.parse(savedValue);
    }

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    remove(key) {
        localStorage.removeItem(key);
    }
}

const dataStore = new LocalStorageDataStore();

guard();
defaultAdminUser();

function normalizeEmail(email) {
    return String(email ?? '').trim().toLowerCase();
}

function defaultAdminUser() {
    const users = getUsers();
    const adminExists = users.some(user => normalizeEmail(user.email) === 'admin@store.com');

    if (adminExists) {
        return;
    }

    users.push({
        name: 'Admin',
        email: 'admin@store.com',
        password: 'admin123',
        role: 'admin'
    });
    saveUsers(users);
}

function guard() {
    const currentPath = window.location.pathname;
    const currentUser = getCurrentUser();
    const isAdminPage = currentPath.includes('/admin/');
    const isLoginPage = currentPath.endsWith('login.html');
    const isSignupPage = currentPath.endsWith('signup.html');
    const isAuthPage = isLoginPage || isSignupPage;

    if (!currentUser) {
        if (!isAuthPage) {
            redirectTo('login.html');
        }
        return;
    }

    if (isAdminPage && currentUser.role !== 'admin') {
        redirectTo('index.html');
        return;
    }

    if (currentUser.role === 'admin' && (!isAdminPage || isAuthPage)) {
        redirectTo('admin/categories.html');
        return;
    }

    if (isAuthPage) {
        redirectTo('index.html');
    }
}

function redirectTo(path) {
    const isAdminPage = window.location.pathname.includes('/admin/');
    const appRoot = new URL(isAdminPage ? '../' : './', window.location.href);
    window.location.href = new URL(path, appRoot).href;
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

function getUsers() {
    return dataStore.get('users', []);
}

function saveUsers(users) {
    dataStore.set('users', users);
}

function getUserByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    return getUsers().find(user => normalizeEmail(user.email) === normalizedEmail);
}

function getCurrentUser() {
    return dataStore.get('user');
}

function saveCurrentUser(user) {
    dataStore.set('user', user);
}

function removeCurrentUser() {
    dataStore.remove('user');
}

function logout() {
    removeCurrentUser();
    redirectTo('login.html');
}

function register() {
    const form = document.getElementById('signup-form');
    const message = document.getElementById('form-message');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const users = getUsers();

    message.hidden = true;
    message.textContent = '';

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (!name) {
        message.textContent = 'Enter your name.';
        message.hidden = false;
        return;
    }

    if (users.some(user => user.email.toLowerCase() === email)) {
        message.textContent = 'An account with this email already exists.';
        message.hidden = false;
        return;
    }

    users.push({ name, email, password, role: 'user' });
    saveUsers(users);
    window.location.href = 'login.html';
}

function getProducts() {
    return dataStore.get('products', []);
}

function saveProducts(products) {
    dataStore.set('products', products);
}

function getCategories() {
    return dataStore.get('categories', []);
}

function saveCategories(categories) {
    dataStore.set('categories', categories);
}

function updateProductStock(productId, newStock) {
    const products = getProducts();
    const product = products.find(item => item.id === productId);

    if (!product) {
        return;
    }

    product.stockQuantity = newStock;
    saveProducts(products);
}

function getProduct(productId) {
    return getProducts().find(product => product.id === productId);
}

function getCart() {
    return dataStore.get('cart', []);
}

function saveCart(cart) {
    dataStore.set('cart', cart);
}

function addProductToCart(productId) {
    const product = getProduct(productId);
    if (!product) {
        return 'This product is no longer available.';
    }

    if (product.stockQuantity <= 0) {
        return 'This product is out of stock.';
    }

    const cart = getCart();
    const cartItem = cart.find(item => item.productId === productId);

    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ productId, quantity: 1 });
    }

    updateProductStock(productId, product.stockQuantity - 1);
    saveCart(cart);
    return '';
}

function changeProductCartQuantity(productId, amount) {
    const cart = getCart();
    const cartItem = cart.find(item => item.productId === productId);
    const product = getProduct(productId);

    if (!cartItem || !product) {
        return 'This product is not in your cart.';
    }

    if (amount > product.stockQuantity) {
        return 'There is not enough stock for another item.';
    }

    const quantity = cartItem.quantity + amount;
    if (quantity <= 0) {
        saveCart(cart.filter(item => item.productId !== productId));
    } else {
        cartItem.quantity = quantity;
        saveCart(cart);
    }

    updateProductStock(productId, product.stockQuantity - amount);
    return '';
}

function removeProductFromCart(productId) {
    const cart = getCart();
    const cartItem = cart.find(item => item.productId === productId);
    const product = getProduct(productId);

    if (cartItem && product) {
        updateProductStock(productId, product.stockQuantity + cartItem.quantity);
    }

    saveCart(cart.filter(item => item.productId !== productId));
}

function getOrders() {
    return dataStore.get('orders', []);
}

function saveOrders(orders) {
    dataStore.set('orders', orders);
}

function requestOrderReturn(orderId, reason) {
    const user = getCurrentUser();
    const orders = getOrders();
    const order = orders.find(item => item.id === orderId);

    if (!user || user.role !== 'user' || !order || order.customer.email !== user.email) {
        return 'Order not found.';
    }
    if (order.status !== 'confirmed' || order.returnStatus) {
        return 'Only confirmed orders without an existing return request can be returned.';
    }
    if (!reason.trim()) {
        return 'Enter a reason for the return.';
    }

    order.returnStatus = 'pending';
    order.returnReason = reason.trim();
    order.returnUpdatedAt = new Date().toISOString();
    saveOrders(orders);
    return '';
}

function updateOrderReturnStatus(orderId, status) {
    const orders = getOrders();
    const order = orders.find(item => item.id === orderId);
    if (!order || order.returnStatus !== 'pending' || !['approved', 'rejected'].includes(status)) {
        return 'This return request is no longer pending.';
    }

    if (status === 'approved') {
        const products = getProducts();
        order.items.forEach(orderItem => {
            const product = products.find(item => item.id === orderItem.productId);
            if (product) {
                product.stockQuantity += orderItem.quantity;
            }
        });
        saveProducts(products);
    }

    order.returnStatus = status;
    order.returnUpdatedAt = new Date().toISOString();
    saveOrders(orders);
    return '';
}

function getWishlist() {
    const user = getCurrentUser();
    if (!user || user.role !== 'user') {
        return [];
    }

    const wishlists = dataStore.get('wishlists', {});
    return wishlists[user.email.toLowerCase()] || [];
}

function saveWishlist(productIds) {
    const user = getCurrentUser();
    if (!user || user.role !== 'user') {
        return;
    }

    const wishlists = dataStore.get('wishlists', {});
    wishlists[user.email.toLowerCase()] = productIds;
    dataStore.set('wishlists', wishlists);
}

function getProductReviews(productId) {
    return dataStore.get('reviews', []).filter(review => review.productId === productId);
}

function makeRatingStars(rating) {
    const value = Number(rating);
    const stars = document.createElement('span');
    stars.className = 'rating-stars';
    stars.setAttribute('role', 'img');
    stars.setAttribute('aria-label', `${value.toFixed(1)} out of 5 stars`);
    stars.textContent = `${'★'.repeat(Math.round(value))}${'☆'.repeat(5 - Math.round(value))}`;
    return stars;
}

function saveProductReview(productId, rating, comment) {
    const user = getCurrentUser();
    if (!user || user.role !== 'user') {
        return 'Only customers can leave product feedback.';
    }

    const value = Number(rating);
    const text = comment.trim();
    if (!Number.isInteger(value) || value < 1 || value > 5) {
        return 'Choose a rating from 1 to 5 stars.';
    }
    if (!text) {
        return 'Write a short review.';
    }

    const reviews = dataStore.get('reviews', []);
    const existing = reviews.find(review =>
        review.productId === productId && review.customerEmail === user.email.toLowerCase()
    );
    const review = {
        productId,
        customerEmail: user.email.toLowerCase(),
        customerName: user.name,
        rating: value,
        comment: text,
        updatedAt: new Date().toISOString()
    };

    if (existing) {
        Object.assign(existing, review);
    } else {
        reviews.push(review);
    }
    dataStore.set('reviews', reviews);
    return '';
}
