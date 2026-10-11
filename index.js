const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const productsContainer = document.getElementById('products-container');
const cartCount = document.getElementById('cart-count');
const wishlistCount = document.getElementById('wishlist-count');
const cartMessage = document.getElementById('cart-error');

init();

function init() {
    const user = getCurrentUser();
    document.getElementById('welcome').textContent = `Welcome, ${user.name}!`;
    searchInput.addEventListener('input', render);
    categoryFilter.addEventListener('change', render);
    updateCartCount();
    updateWishlistCount();
    renderCategoryFilter();
    render();
}

function renderCategoryFilter() {
    const selectedCategory = categoryFilter.value;
    categoryFilter.replaceChildren(new Option('All categories', ''));

    getCategories().forEach(category => {
        categoryFilter.add(new Option(category.name, category.id));
    });

    categoryFilter.value = selectedCategory;
}

function money(amount) {
    return `$${amount.toFixed(2)}`;
}

function addToCart(productId) {
    const error = addProductToCart(productId);
    if (error) {
        cartMessage.textContent = error;
        return;
    }

    updateCartCount();
    render();
}

function updateCartCount() {
    const cart = getCart();
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    cartMessage.textContent = cart.length === 0 ? 'Your cart is empty.' : '';
}

function updateWishlistCount() {
    wishlistCount.textContent = getWishlist().length;
}

function toggleWishlist(productId) {
    const wishlist = getWishlist();
    const isSaved = wishlist.includes(productId);
    saveWishlist(isSaved
        ? wishlist.filter(id => id !== productId)
        : [...wishlist, productId]);
    updateWishlistCount();
    render();
}

function makeCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';

    const img = document.createElement('img');
    img.className = 'product-card__image';
    img.src = product.image;
    img.alt = product.name;

    const content = document.createElement('div');
    content.className = 'product-card__content';

    const category = getCategories().find(item => item.id === product.categoryId);
    const categoryLabel = document.createElement('p');
    categoryLabel.className = 'product-card__category';
    categoryLabel.textContent = category ? category.name : product.category;

    const name = document.createElement('h2');
    const detailsLink = document.createElement('a');
    detailsLink.href = `product.html?id=${encodeURIComponent(product.id)}`;
    detailsLink.textContent = product.name;
    name.appendChild(detailsLink);

    const desc = document.createElement('p');
    desc.className = 'product-card__description';
    desc.textContent = product.description;

    const stock = document.createElement('p');
    stock.className = 'product-card__stock';
    stock.textContent = product.stockQuantity > 0
        ? `${product.stockQuantity} in stock`
        : 'Out of stock!';

    const footer = document.createElement('div');
    footer.className = 'product-card__footer';

    const price = document.createElement('p');
    price.className = 'product-card__price';
    price.textContent = money(product.price);

    const cartButton = document.createElement('button');
    const wishlistButton = document.createElement('button');
    const isWishlisted = getWishlist().includes(product.id);

    cartButton.textContent = 'Add to cart';
    cartButton.disabled = product.stockQuantity < 1;
    cartButton.addEventListener('click', () => addToCart(product.id));

    wishlistButton.type = 'button';
    wishlistButton.className = 'projects-button projects-button-secondary';
    wishlistButton.textContent = isWishlisted ? 'In wishlist' : 'Add to wishlist';
    wishlistButton.setAttribute('aria-label', isWishlisted
        ? `Remove ${product.name} from wishlist`
        : `Add ${product.name} to wishlist`);
    wishlistButton.setAttribute('aria-pressed', isWishlisted);
    wishlistButton.addEventListener('click', () => toggleWishlist(product.id));

    const actions = document.createElement('div');
    actions.className = 'product-card__actions';
    actions.append(cartButton, wishlistButton);

    footer.append(price, actions);
    const reviewsLink = document.createElement('a');
    reviewsLink.className = 'product-card__reviews-link';
    reviewsLink.href = detailsLink.href;
    const reviews = getProductReviews(product.id);
    if (reviews.length) {
        const average = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
        reviewsLink.append(
            makeRatingStars(average),
            document.createTextNode(` ${average.toFixed(1)} / 5 · ${reviews.length} review${reviews.length === 1 ? '' : 's'}`)
        );
    } else {
        reviewsLink.textContent = 'View details and reviews';
    }
    content.append(categoryLabel, name, desc, stock, footer, reviewsLink);
    card.append(img, content);
    return card;
}

function render() {
    const query = searchInput.value.trim().toLowerCase();
    const products = getProducts();
    const matchingProducts = products.filter(product =>
        product.name.toLowerCase().includes(query)
        && (!categoryFilter.value || product.categoryId === categoryFilter.value)
    );

    productsContainer.innerHTML = '';
    if (matchingProducts.length === 0) {
        productsContainer.innerHTML = '<div class="projects-empty">No products found.</div>';
        return;
    }

    matchingProducts.forEach(product => {
        productsContainer.appendChild(makeCard(product));
    });
}
