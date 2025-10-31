let currentUser = null;
let currentGuildId = null;
let guilds = [];

document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    await loadGuilds();
});

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

async function loadGuilds() {
    try {
        console.log('🔄 Guilds betöltése...');
        
        const response = await fetch('/api/guilds', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        console.log('📦 API Response:', data);
        
        if (data.success) {
            console.log('📊 Összes guild az API-tól:', data.guilds.length);
            console.log('📋 Guilds lista:', data.guilds);
            
            guilds = data.guilds.filter(guild => {
                const hasAdminPermission = (guild.permissions & 0x8) === 0x8;
                const botInGuild = guild.bot_in_guild === true;
                const result = (hasAdminPermission || guild.owner) && botInGuild;
                
                console.log(`🔐 "${guild.name}":`, {
                    permissions: guild.permissions,
                    permissionsBinary: guild.permissions ? guild.permissions.toString(2).padStart(16, '0') : 'undefined',
                    hasAdmin: hasAdminPermission,
                    isOwner: guild.owner,
                    botInGuild: botInGuild,
                    passes: result
                });
                
                return result;
            });
            
            console.log('✅ Szűrés után:', guilds.length, 'guild');
            displayGuilds();
        } else {
            console.error('❌ API hiba:', data.error);
            showStatus('Hiba a szerverek betöltése során', 'error');
        }
    } catch (error) {
        console.error('❌ Guilds betöltési hiba:', error);
        showStatus('Hiba a szerverek betöltése során', 'error');
    }
}

function displayGuilds() {
    const guildsListEl = document.getElementById('guildsList');
    
    if (guilds.length === 0) {
        guildsListEl.innerHTML = `
            <div class="no-guilds">
                <p>Nincs kezelhető szerver</p>
                <small>Győződj meg róla, hogy van "Administrator" jogosultságod a szerveren</small>
            </div>
        `;
        return;
    }
    
    guildsListEl.innerHTML = guilds.map(guild => {
        const iconUrl = guild.icon 
            ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
            : '/static/images/default-guild.png';
        
        return `
            <div class="guild-item ${currentGuildId === guild.id ? 'active' : ''}" 
                 onclick="selectGuild('${guild.id}', '${escapeHtml(guild.name)}', '${iconUrl}', ${guild.owner})">
                <img src="${iconUrl}" alt="${escapeHtml(guild.name)}" class="guild-icon" 
                     onerror="this.src='/static/images/default-guild.png'">
                <div class="guild-details">
                    <span class="guild-name">${escapeHtml(guild.name)}</span>
                    ${guild.owner ? '<span class="owner-badge"><i class="fas fa-crown"></i> Owner</span>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

function selectGuild(guildId, guildName, iconUrl, isOwner) {
    currentGuildId = guildId;
    
    document.querySelectorAll('.guild-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    document.getElementById('noGuildSelected').style.display = 'none';
    document.getElementById('configForm').style.display = 'block';
    
    document.getElementById('selectedGuildName').textContent = guildName;
    document.getElementById('selectedGuildId').textContent = guildId;
    document.getElementById('selectedGuildIcon').src = iconUrl;
    document.getElementById('selectedGuildIcon').onerror = function() {
        this.src = '/static/images/default-guild.png';
    };
    
    loadConfig();
}

async function loadConfig() {
    if (!currentGuildId) {
        showStatus('Nincs kiválasztott szerver', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/config/${currentGuildId}`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            document.getElementById('testMessage').value = data.test_message || '';
            showStatus('Konfiguráció betöltve', 'success');
        } else {
            if (response.status === 403) {
                showStatus('Nincs jogosultságod ehhez a szerverhez', 'error');
            } else {
                showStatus(data.error || 'Hiba a betöltés során', 'error');
            }
        }
    } catch (error) {
        console.error('Config betöltési hiba:', error);
        showStatus('Hiba a betöltés során', 'error');
    }
}

async function saveConfig() {
    if (!currentGuildId) {
        showStatus('Nincs kiválasztott szerver', 'error');
        return;
    }
    
    const testMessage = document.getElementById('testMessage').value;
    
    if (!testMessage.trim()) {
        showStatus('Töltsd ki az üzenet mezőt!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/config/${currentGuildId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                test_message: testMessage
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showStatus('Sikeresen mentve! ✨', 'success');
        } else {
            if (response.status === 403) {
                showStatus('Nincs jogosultságod ehhez a szerverhez', 'error');
            } else if (response.status === 401) {
                showStatus('Session lejárt, jelentkezz be újra', 'error');
                setTimeout(() => window.location.href = '/auth/login', 2000);
            } else {
                showStatus(data.error || 'Hiba a mentés során', 'error');
            }
        }
    } catch (error) {
        console.error('Mentési hiba:', error);
        showStatus('Hiba a mentés során', 'error');
    }
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

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status show ${type}`;
    
    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 5000);
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}