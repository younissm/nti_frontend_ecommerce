function createProduct(values) {
    const error = validateProduct(values);
    if (error) {
        return error;
    }

    const products = getProducts();
    products.push({
        id: createId(values.name, products),
        ...values,
        name: values.name.trim(),
        image: values.image.trim(),
        description: values.description.trim(),
        price: Number(values.price),
        stockQuantity: Number(values.stockQuantity),
        category: getCategories().find(category => category.id === values.categoryId).name
    });
    saveProducts(products);
    return '';
}

function updateProduct(id, values) {
    const products = getProducts();
    const product = products.find(item => item.id === id);
    if (!product) {
        return 'Product not found.';
    }

    const error = validateProduct(values, id);
    if (error) {
        return error;
    }

    Object.assign(product, values, {
        name: values.name.trim(),
        image: values.image.trim(),
        description: values.description.trim(),
        price: Number(values.price),
        stockQuantity: Number(values.stockQuantity),
        category: getCategories().find(category => category.id === values.categoryId).name
    });
    saveProducts(products);
    return '';
}

function removeProduct(id) {
    const product = getProducts().find(item => item.id === id);
    if (!product) {
        return 'Product not found.';
    }

    if (getCart().some(item => item.productId === id)) {
        return 'Remove this product from the cart before deleting it.';
    }

    if (getOrders().some(order =>
        order.status === 'pending' && order.items.some(item => item.productId === id)
    )) {
        return 'This product is part of a pending order and cannot be deleted yet.';
    }

    saveProducts(getProducts().filter(item => item.id !== id));
    return '';
}

function validateProduct(values, existingId = '') {
    const name = values.name.trim();
    if (!name) {
        return 'Enter a product name.';
    }

    if (getProducts().some(item =>
        item.id !== existingId && item.name.toLowerCase() === name.toLowerCase()
    )) {
        return 'A product with this name already exists.';
    }

    if (!getCategories().some(category => category.id === values.categoryId)) {
        return 'Choose a valid category.';
    }

    if (!isValidProductImage(values.image)) {
        return 'Enter a valid image URL or base64 image.';
    }

    if (!Number.isFinite(Number(values.price)) || Number(values.price) <= 0) {
        return 'Price must be greater than zero.';
    }

    if (!Number.isInteger(Number(values.stockQuantity)) || Number(values.stockQuantity) < 0) {
        return 'Stock must be a whole number of zero or more.';
    }

    if (!values.description.trim()) {
        return 'Enter a product description.';
    }

    return '';
}

function isValidProductImage(value) {
    if (/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,[a-z0-9+/]+=*$/i.test(value)) {
        return true;
    }

    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

function createId(name, products) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product';
    let id = base;
    let number = 2;

    while (products.some(product => product.id === id)) {
        id = `${base}-${number}`;
        number++;
    }

    return id;
}
