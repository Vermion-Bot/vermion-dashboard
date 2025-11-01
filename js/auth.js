async function checkAuth() {
    try {
        const response = await fetch('/api/me', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            window.location.href = '/auth/login';
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            displayUserInfo();
        } else {
            window.location.href = '/auth/login';
        }
    } catch (error) {
        console.error('Auth hiba:', error);
        window.location.href = '/auth/login';
    }
}

function displayUserInfo() {
    const userInfoEl = document.getElementById('userInfo');
    
    const avatarUrl = currentUser.avatar 
        ? `https://cdn.discordapp.com/avatars/${currentUser.id}/${currentUser.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(currentUser.discriminator) % 5}.png`;
    
    userInfoEl.innerHTML = `
        <div class="user-display">
            <img src="${avatarUrl}" alt="${currentUser.username}" class="user-avatar">
            <div class="user-details">
                <span class="user-name">${currentUser.username}</span>
                ${currentUser.discriminator !== '0' ? `<span class="user-tag">#${currentUser.discriminator}</span>` : ''}
            </div>
            <button class="btn-logout" onclick="logout()" title="Kijelentkezés">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        </div>
    `;
}

async function logout() {
    try {
        await fetch('/auth/logout', {
            credentials: 'include'
        });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout hiba:', error);
        window.location.href = '/';
    }
}