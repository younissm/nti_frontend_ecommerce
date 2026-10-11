function createCategory(name) {
    name = name.trim();
    const categories = getCategories();

    if (!name) {
        return 'Enter a category name.';
    }

    if (categories.some(category => category.name.toLowerCase() === name.toLowerCase())) {
        return 'A category with this name already exists.';
    }

    const baseId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category';
    let id = baseId;
    let number = 2;

    while (categories.some(category => category.id === id)) {
        id = `${baseId}-${number}`;
        number++;
    }

    categories.push({ id, name });
    saveCategories(categories);
    return '';
}

function updateCategory(id, name) {
    name = name.trim();
    const categories = getCategories();
    const category = categories.find(item => item.id === id);

    if (!name) {
        return 'Enter a category name.';
    }

    if (!category) {
        return 'Category not found.';
    }

    if (categories.some(item => item.id !== id && item.name.toLowerCase() === name.toLowerCase())) {
        return 'A category with this name already exists.';
    }

    category.name = name;
    saveCategories(categories);
    const products = getProducts();
    let productsChanged = false;
    products.forEach(product => {
        if (product.categoryId === id) {
            product.category = name;
            productsChanged = true;
        }
    });
    if (productsChanged) {
        saveProducts(products);
    }
    return '';
}

function removeCategory(id) {
    const categories = getCategories();

    if (!categories.some(category => category.id === id)) {
        return 'Category not found.';
    }

    if (getProducts().some(product => product.categoryId === id)) {
        return 'Move or delete this category’s products before deleting it.';
    }

    saveCategories(categories.filter(category => category.id !== id));
    return '';
}
