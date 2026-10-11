const loginForm = document.getElementById('login-form');

function login() {
    const message = document.getElementById('form-message');
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const user = getUserByEmail(email);

    if (!user || user.password !== password) {
        message.textContent = 'Invalid email or password';
        message.hidden = false;
        return;
    }

    message.textContent = '';
    message.hidden = true;
    saveCurrentUser(user);
    window.location.href = user.role === 'admin'
        ? 'admin/categories.html'
        : 'index.html';
}

loginForm.addEventListener('submit', event => {
    event.preventDefault();
    login();
});