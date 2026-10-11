const userForm = document.getElementById('user-form');
const userMessage = document.getElementById('user-message');
const usersList = document.getElementById('users-list');

document.getElementById('logout').addEventListener('click', logout);
userForm.addEventListener('submit', saveUser);
document.getElementById('user-cancel').addEventListener('click', resetUserForm);
renderUsers();

function renderUsers() {
    const currentUser = getCurrentUser();
    usersList.replaceChildren();

    getUsers().forEach(user => {
        const row = document.createElement('article');
        row.className = 'category-row';

        const details = document.createElement('span');
        details.textContent = `${user.name} · ${user.email} · ${user.role === 'admin' ? 'Admin' : 'Customer'}${user.email === currentUser.email ? ' (you)' : ''}`;

        const editButton = makeButton('Edit', () => editUser(user));
        const deleteButton = makeButton('Delete', () => deleteUser(user.email), true);
        deleteButton.disabled = user.email === currentUser.email;
        row.append(details, editButton, deleteButton);
        usersList.appendChild(row);
    });
}

function saveUser(event) {
    event.preventDefault();
    clearUserMessage();
    if (!userForm.reportValidity()) {
        return;
    }

    const values = Object.fromEntries(new FormData(userForm));
    const email = document.getElementById('user-email-original').value;
    const error = email ? updateUser(email, values) : createUser(values);

    if (error) {
        showUserMessage(error);
        return;
    }

    resetUserForm();
    renderUsers();
}

function editUser(user) {
    document.getElementById('user-email-original').value = user.email;
    userForm.elements.name.value = user.name;
    userForm.elements.email.value = user.email;
    userForm.elements.password.value = '';
    userForm.elements.password.required = false;
    userForm.elements.password.placeholder = 'Leave blank to keep current password';
    userForm.elements.role.value = user.role;
    document.getElementById('user-form-title').textContent = 'Edit user';
    document.getElementById('user-submit').textContent = 'Save changes';
    document.getElementById('user-cancel').hidden = false;
    userForm.scrollIntoView({ behavior: 'smooth' });
}

function deleteUser(email) {
    const error = removeUser(email);
    if (error) {
        showUserMessage(error);
        return;
    }
    clearUserMessage();
    renderUsers();
}

function resetUserForm() {
    userForm.reset();
    document.getElementById('user-email-original').value = '';
    userForm.elements.password.required = true;
    userForm.elements.password.placeholder = '';
    document.getElementById('user-form-title').textContent = 'Add user';
    document.getElementById('user-submit').textContent = 'Add user';
    document.getElementById('user-cancel').hidden = true;
    clearUserMessage();
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

function showUserMessage(message) {
    userMessage.textContent = message;
    userMessage.hidden = false;
}

function clearUserMessage() {
    userMessage.textContent = '';
    userMessage.hidden = true;
}
