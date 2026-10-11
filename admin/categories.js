const categoryForm = document.getElementById('category-form');
const categoryIdInput = document.getElementById('category-id');
const categoryNameInput = document.getElementById('category-name');
const categoryMessage = document.getElementById('category-message');
const categorySubmit = document.getElementById('category-submit');
const cancelEditButton = document.getElementById('cancel-edit');
const categoriesList = document.getElementById('categories-list');

init();

function init() {
    document.getElementById('logout').addEventListener('click', logout);
    categoryForm.addEventListener('submit', saveCategory);
    cancelEditButton.addEventListener('click', resetForm);
    renderCategories();
}

function renderCategories() {
    const categories = getCategories();
    categoriesList.replaceChildren();

    if (categories.length === 0) {
        categoriesList.textContent = 'No categories yet.';
        return;
    }

    categories.forEach(category => {
        const row = document.createElement('article');
        row.className = 'category-row';

        const name = document.createElement('span');
        name.textContent = category.name;

        const editButton = makeButton('Edit', () => startEditing(category));
        const deleteButton = makeButton('Delete', () => deleteCategory(category.id));

        row.append(name, editButton, deleteButton);
        categoriesList.appendChild(row);
    });
}

function saveCategory(event) {
    event.preventDefault();
    clearMessage();

    if (!categoryForm.reportValidity()) {
        return;
    }

    const editingId = categoryIdInput.value;
    const error = editingId
        ? updateCategory(editingId, categoryNameInput.value)
        : createCategory(categoryNameInput.value);

    if (error) {
        showMessage(error);
        return;
    }

    resetForm();
    renderCategories();
}

function startEditing(category) {
    clearMessage();
    categoryIdInput.value = category.id;
    categoryNameInput.value = category.name;
    categorySubmit.textContent = 'Save changes';
    cancelEditButton.hidden = false;
    categoryNameInput.focus();
}

function deleteCategory(categoryId) {
    const error = removeCategory(categoryId);
    if (error) {
        showMessage(error);
        return;
    }

    if (categoryIdInput.value === categoryId) {
        resetForm();
    }
    clearMessage();
    renderCategories();
}

function makeButton(label, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'projects-button projects-button-secondary';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

function resetForm() {
    categoryForm.reset();
    categoryIdInput.value = '';
    categorySubmit.textContent = 'Add category';
    cancelEditButton.hidden = true;
    clearMessage();
}

function showMessage(message) {
    categoryMessage.textContent = message;
    categoryMessage.hidden = false;
}

function clearMessage() {
    categoryMessage.textContent = '';
    categoryMessage.hidden = true;
}
