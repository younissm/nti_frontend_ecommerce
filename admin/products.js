const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const productCategory = document.getElementById('product-category');
const productMessage = document.getElementById('product-message');
const productImageInput = document.getElementById('product-image');
const productImagePreview = document.getElementById('product-image-preview');
const productsList = document.getElementById('products-list');
let uploadedProductImage = '';

document.getElementById('logout').addEventListener('click', logout);
productForm.addEventListener('submit', saveProduct);
productImageInput.addEventListener('change', previewProductImage);
document.getElementById('product-cancel').addEventListener('click', resetProductForm);
renderCategoryOptions();
renderProducts();

function renderCategoryOptions() {
    productCategory.replaceChildren(new Option('Choose a category', ''));
    getCategories().forEach(category => {
        productCategory.add(new Option(category.name, category.id));
    });
}

function renderProducts() {
    productsList.replaceChildren();
    const products = getProducts();

    if (products.length === 0) {
        productsList.textContent = 'No products yet.';
        return;
    }

    products.forEach(product => {
        const row = document.createElement('article');
        row.className = 'admin-product';

        const image = document.createElement('img');
        image.src = product.image;
        image.alt = '';

        const details = document.createElement('div');
        details.className = 'admin-product__details';
        const name = document.createElement('h3');
        name.textContent = product.name;
        const summary = document.createElement('p');
        summary.textContent = `${product.category} · $${product.price.toFixed(2)} · ${product.stockQuantity} in stock`;
        const description = document.createElement('p');
        description.textContent = product.description;
        details.append(name, summary, description);

        const actions = document.createElement('div');
        actions.className = 'admin-row-actions';
        actions.append(
            makeButton('Edit', () => editProduct(product)),
            makeButton('Delete', () => deleteProduct(product.id), true)
        );

        row.append(image, details, actions);
        productsList.appendChild(row);
    });
}

function saveProduct(event) {
    event.preventDefault();
    clearProductMessage();

    if (!productForm.reportValidity()) {
        return;
    }

    const values = Object.fromEntries(new FormData(productForm));
    const id = productIdInput.value;
    values.image = uploadedProductImage || (id ? getProduct(id)?.image : '');
    if (!values.image) {
        showProductMessage('Choose an image for this product.');
        return;
    }

    const error = id ? updateProduct(id, values) : createProduct(values);

    if (error) {
        showProductMessage(error);
        return;
    }

    resetProductForm();
    renderProducts();
}

async function previewProductImage() {
    const file = productImageInput.files[0];
    if (!file) {
        uploadedProductImage = '';
        showCurrentProductImage();
        return;
    }

    uploadedProductImage = '';
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
        productImageInput.value = '';
        showCurrentProductImage();
        showProductMessage('Choose a PNG, JPEG, WebP, or GIF image.');
        return;
    }

    if (file.size > 1024 * 1024) {
        productImageInput.value = '';
        showCurrentProductImage();
        showProductMessage('Choose an image smaller than 1 MB.');
        return;
    }

    try {
        uploadedProductImage = await readImageFile(file);
        productImagePreview.src = uploadedProductImage;
        productImagePreview.hidden = false;
        clearProductMessage();
    } catch {
        uploadedProductImage = '';
        productImageInput.value = '';
        showCurrentProductImage();
        showProductMessage('Could not read that image. Please choose another file.');
    }
}

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result));
        reader.addEventListener('error', () => reject(reader.error));
        reader.readAsDataURL(file);
    });
}

function editProduct(product) {
    productIdInput.value = product.id;
    productForm.elements.name.value = product.name;
    productForm.elements.categoryId.value = product.categoryId;
    productImageInput.value = '';
    uploadedProductImage = '';
    productImagePreview.src = product.image;
    productImagePreview.hidden = false;
    productForm.elements.price.value = product.price;
    productForm.elements.stockQuantity.value = product.stockQuantity;
    productForm.elements.description.value = product.description;
    document.getElementById('product-form-title').textContent = 'Edit product';
    document.getElementById('product-submit').textContent = 'Save changes';
    document.getElementById('product-cancel').hidden = false;
    productForm.scrollIntoView({ behavior: 'smooth' });
}

function deleteProduct(id) {
    const error = removeProduct(id);
    if (error) {
        showProductMessage(error);
        return;
    }

    clearProductMessage();
    renderProducts();
}

function resetProductForm() {
    productForm.reset();
    productIdInput.value = '';
    uploadedProductImage = '';
    productImagePreview.removeAttribute('src');
    productImagePreview.hidden = true;
    document.getElementById('product-form-title').textContent = 'Add product';
    document.getElementById('product-submit').textContent = 'Add product';
    document.getElementById('product-cancel').hidden = true;
    clearProductMessage();
}

function makeButton(label, onClick, secondary = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = secondary
        ? 'projects-button projects-button-secondary'
        : 'projects-button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

function showProductMessage(message) {
    productMessage.textContent = message;
    productMessage.hidden = false;
}

function clearProductMessage() {
    productMessage.textContent = '';
    productMessage.hidden = true;
}

function showCurrentProductImage() {
    const product = getProduct(productIdInput.value);
    if (product) {
        productImagePreview.src = product.image;
        productImagePreview.hidden = false;
    } else {
        productImagePreview.removeAttribute('src');
        productImagePreview.hidden = true;
    }
}
