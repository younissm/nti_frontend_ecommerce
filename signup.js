const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', event => {
    event.preventDefault();
    register();
});
