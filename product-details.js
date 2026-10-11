const productDetails = document.getElementById('product-details');
const reviewsSection = document.getElementById('reviews-section');
const productMessage = document.getElementById('product-message');
const productId = new URLSearchParams(window.location.search).get('id');

document.getElementById('logout').addEventListener('click', logout);
renderProduct();

function renderProduct() {
    const product = getProduct(productId);
    productDetails.replaceChildren();
    reviewsSection.replaceChildren();

    if (!product) {
        productDetails.textContent = 'This product is no longer available.';
        return;
    }

    document.title = product.name;
    document.getElementById('cart-count').textContent = getCart()
        .reduce((total, item) => total + item.quantity, 0);

    const card = document.createElement('article');
    card.className = 'product-detail';

    const image = document.createElement('img');
    image.src = product.image;
    image.alt = product.name;

    const content = document.createElement('div');
    content.className = 'product-detail__content';

    const category = document.createElement('p');
    category.className = 'product-card__category';
    category.textContent = product.category
        || getCategories().find(item => item.id === product.categoryId)?.name
        || '';

    const name = document.createElement('h2');
    name.textContent = product.name;

    const ratingSummary = document.createElement('p');
    ratingSummary.className = 'product-detail__rating';
    const reviews = getProductReviews(product.id);
    if (reviews.length) {
        const average = reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
        ratingSummary.append(
            makeRatingStars(average),
            document.createTextNode(` ${average.toFixed(1)} / 5 · ${reviews.length} review${reviews.length === 1 ? '' : 's'}`)
        );
    } else {
        ratingSummary.textContent = 'No ratings yet';
    }

    const description = document.createElement('p');
    description.className = 'product-detail__description';
    description.textContent = product.description;

    const price = document.createElement('p');
    price.className = 'product-detail__price';
    price.textContent = `$${product.price.toFixed(2)}`;

    const stock = document.createElement('p');
    stock.className = 'product-card__stock';
    stock.textContent = product.stockQuantity > 0
        ? `${product.stockQuantity} in stock`
        : 'Out of stock';

    const actions = document.createElement('div');
    actions.className = 'product-detail__actions';
    actions.append(
        makeButton('Add to cart', () => addToCart(product.id), product.stockQuantity <= 0),
        makeButton(
            getWishlist().includes(product.id) ? 'In wishlist' : 'Add to wishlist',
            () => toggleWishlist(product.id),
            false,
            true
        )
    );

    content.append(category, name, ratingSummary, description, price, stock, actions);
    card.append(image, content);
    productDetails.appendChild(card);
    renderReviews(product);
}

function renderReviews(product) {
    const reviews = getProductReviews(product.id);
    const heading = document.createElement('h2');
    heading.textContent = `Customer reviews (${reviews.length})`;
    reviewsSection.appendChild(heading);

    if (reviews.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'reviews-empty';
        empty.textContent = 'No reviews yet. Share your experience with this product.';
        reviewsSection.appendChild(empty);
    } else {
        const list = document.createElement('div');
        list.className = 'reviews-list';
        reviews.forEach(review => list.appendChild(makeReview(review)));
        reviewsSection.appendChild(list);
    }

    reviewsSection.appendChild(makeReviewForm(product, reviews));
}

function makeReview(review) {
    const card = document.createElement('article');
    card.className = 'review-card';

    const header = document.createElement('div');
    header.className = 'review-card__header';
    const author = document.createElement('strong');
    author.textContent = review.customerName;
    const rating = document.createElement('span');
    rating.className = 'review-rating';
    rating.append(
        makeRatingStars(review.rating),
        document.createTextNode(` ${review.rating} / 5`)
    );
    header.append(author, rating);

    const comment = document.createElement('p');
    comment.textContent = review.comment;

    const date = document.createElement('time');
    date.className = 'review-date';
    date.dateTime = review.updatedAt;
    date.textContent = new Date(review.updatedAt).toLocaleDateString();

    card.append(header, comment, date);
    return card;
}

function makeReviewForm(product, reviews) {
    const currentUser = getCurrentUser();
    const existing = reviews.find(review =>
        review.customerEmail === currentUser.email.toLowerCase()
    );
    const form = document.createElement('form');
    form.className = 'review-form';

    const heading = document.createElement('h3');
    heading.textContent = existing ? 'Update your review' : 'Write a review';

    const ratingLabel = document.createElement('label');
    ratingLabel.textContent = 'Your rating';
    const rating = document.createElement('select');
    rating.required = true;
    rating.add(new Option('Choose a rating', ''));
    for (let stars = 5; stars >= 1; stars--) {
        rating.add(new Option(`${stars} out of 5`, String(stars)));
    }
    if (existing) {
        rating.value = String(existing.rating);
    }
    ratingLabel.appendChild(rating);

    const commentLabel = document.createElement('label');
    commentLabel.textContent = 'Your feedback';
    const comment = document.createElement('textarea');
    comment.required = true;
    comment.maxLength = 500;
    comment.rows = 4;
    comment.placeholder = 'What did you think of this product?';
    comment.value = existing ? existing.comment : '';
    commentLabel.appendChild(comment);

    const message = document.createElement('p');
    message.className = 'form-message';
    message.hidden = true;

    const submit = makeButton(existing ? 'Update review' : 'Submit review');
    submit.type = 'submit';
    form.append(heading, ratingLabel, commentLabel, message, submit);
    form.addEventListener('submit', event => {
        event.preventDefault();
        const error = saveProductReview(product.id, rating.value, comment.value);
        if (error) {
            message.textContent = error;
            message.hidden = false;
            return;
        }
        productMessage.textContent = 'Your review has been saved.';
        productMessage.hidden = false;
        renderProduct();
    });
    return form;
}

function addToCart(id) {
    const error = addProductToCart(id);
    showMessage(error || 'Added to cart.');
    renderProduct();
}

function toggleWishlist(id) {
    const wishlist = getWishlist();
    saveWishlist(wishlist.includes(id)
        ? wishlist.filter(item => item !== id)
        : [...wishlist, id]);
    showMessage(wishlist.includes(id) ? 'Removed from wishlist.' : 'Added to wishlist.');
    renderProduct();
}

function makeButton(label, onClick, disabled = false, secondary = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = secondary
        ? 'projects-button projects-button-secondary'
        : 'projects-button';
    button.textContent = label;
    button.disabled = disabled;
    button.addEventListener('click', onClick);
    return button;
}

function showMessage(message) {
    productMessage.textContent = message;
    productMessage.hidden = false;
}
