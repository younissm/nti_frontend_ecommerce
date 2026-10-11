function createUser(values) {
    const error = validateUser(values, true);
    if (error) {
        return error;
    }

    const users = getUsers();
    users.push({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role
    });
    saveUsers(users);
    return '';
}

function updateUser(email, values) {
    const users = getUsers();
    const user = users.find(item => item.email === email);
    if (!user) {
        return 'User not found.';
    }

    const error = validateUser(values, false, email);
    if (error) {
        return error;
    }

    const currentUser = getCurrentUser();
    if (currentUser.email === email && values.role !== 'admin') {
        return 'You cannot change your own admin role.';
    }

    if (user.role === 'admin' && values.role !== 'admin'
        && users.filter(item => item.role === 'admin').length === 1) {
        return 'At least one admin account must remain.';
    }

    user.name = values.name.trim();
    user.email = values.email.trim().toLowerCase();
    user.role = values.role;
    if (values.password) {
        user.password = values.password;
    }
    saveUsers(users);

    if (currentUser.email === email) {
        saveCurrentUser({ ...currentUser, name: user.name, email: user.email });
    }

    return '';
}

function removeUser(email) {
    const users = getUsers();
    const user = users.find(item => item.email === email);
    if (!user) {
        return 'User not found.';
    }

    const currentUser = getCurrentUser();
    if (currentUser.email === email) {
        return 'You cannot delete the account you are currently using.';
    }

    if (user.role === 'admin' && users.filter(item => item.role === 'admin').length === 1) {
        return 'At least one admin account must remain.';
    }

    saveUsers(users.filter(item => item.email !== email));
    const wishlists = dataStore.get('wishlists', {});
    delete wishlists[email.toLowerCase()];
    dataStore.set('wishlists', wishlists);
    return '';
}

function validateUser(values, requirePassword, existingEmail = '') {
    const name = values.name.trim();
    const email = values.email.trim().toLowerCase();

    if (!name) {
        return 'Enter a name.';
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return 'Enter a valid email address.';
    }
    if (getUsers().some(user =>
        user.email.toLowerCase() === email && user.email !== existingEmail
    )) {
        return 'An account with this email already exists.';
    }
    if (!['user', 'admin'].includes(values.role)) {
        return 'Choose a valid account type.';
    }
    if (requirePassword && !values.password) {
        return 'Enter a password.';
    }
    if (values.password && values.password.length < 8) {
        return 'Password must be at least 8 characters.';
    }

    return '';
}
