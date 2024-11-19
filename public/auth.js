let currentUser = null;

function initAuth() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateNavbar();
    }
}
function updateNavbar() {
    const loginLink = document.querySelector('a[href="/login.html"]').parentElement;
    const registerLink = document.querySelector('a[href="/register.html"]').parentElement;
    const profileLink = document.querySelector('a[href="/profile.html"]').parentElement;
    const createPostLink = document.querySelector('a[href="/submit.html"]').parentElement;

    if (currentUser) {
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        profileLink.style.display = 'block';
        createPostLink.style.display = 'block';
        if (!document.getElementById('username-display')) {
            const navbarNav = document.querySelector('.navbar-nav:last-child');
            const userElement = document.createElement('li');
            userElement.className = 'nav-item';
            userElement.innerHTML = `
                <span class="nav-link" id="username-display">Welcome, ${currentUser.username}</span>
            `;
            navbarNav.appendChild(userElement);
            const logoutElement = document.createElement('li');
            logoutElement.className = 'nav-item';
            logoutElement.innerHTML = `
                <a class="nav-link" href="#" onclick="logout(); return false;">Logout</a>
            `;
            navbarNav.appendChild(logoutElement);
        }
    } else {
        loginLink.style.display = 'block';
        registerLink.style.display = 'block';
        profileLink.style.display = 'none';
        createPostLink.style.display = 'none';
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.parentElement.remove();
        }
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    updateNavbar();
    window.location.href = '/';
}
document.addEventListener('DOMContentLoaded', initAuth); 