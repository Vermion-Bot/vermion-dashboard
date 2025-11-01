let currentUser = null;
let currentGuildId = null;
let guilds = [];
let channels = [];
let embedFields = [];
let currentSection = 'config';

document.addEventListener('DOMContentLoaded', async function() {
    await checkAuth();
    await loadGuilds();
    setupEmbedPreviewListeners();
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
        const response = await fetch('/api/guilds', {
            credentials: 'include'
        });
        
        const data = await response.json();
                
        if (data.success) {
            console.log('📊 Összes guild az API-tól:', data.guilds.length);
            
            guilds = data.guilds.filter(guild => {
                const hasAdminPermission = (guild.permissions & 0x8) === 0x8;
                const botInGuild = guild.bot_in_guild === true;
                return (hasAdminPermission || guild.owner) && botInGuild;
            });
            
            displayGuilds();
        } else {
            console.error('❌ API hiba:', data.error);
            showStatus('Hiba a szerverek betöltése során', 'error', 'configStatus');
        }
    } catch (error) {
        console.error('❌ Guilds betöltési hiba:', error);
        showStatus('Hiba a szerverek betöltése során', 'error', 'configStatus');
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
    
    const elements = [
        { icon: 'configGuildIcon', name: 'configGuildName', id: 'configGuildId' },
        { icon: 'embedGuildIcon', name: 'embedGuildName', id: 'embedGuildId' }
    ];
    
    elements.forEach(el => {
        document.getElementById(el.icon).src = iconUrl;
        document.getElementById(el.icon).onerror = function() {
            this.src = '/static/images/default-guild.png';
        };
        document.getElementById(el.name).textContent = guildName;
        document.getElementById(el.id).textContent = guildId;
    });
    
    if (currentSection === 'config') {
        document.getElementById('configSection').style.display = 'block';
        loadConfig();
    } else if (currentSection === 'embed') {
        document.getElementById('embedSection').style.display = 'block';
        loadChannels();
    }
}

function showSection(section) {
    currentSection = section;
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    document.getElementById('configSection').style.display = 'none';
    document.getElementById('embedSection').style.display = 'none';
    
    if (!currentGuildId) {
        document.getElementById('noGuildSelected').style.display = 'flex';
        return;
    }
    
    if (section === 'config') {
        document.getElementById('configSection').style.display = 'block';
        loadConfig();
    } else if (section === 'embed') {
        document.getElementById('embedSection').style.display = 'block';
        loadChannels();
    }
}

async function loadConfig() {
    if (!currentGuildId) {
        showStatus('Nincs kiválasztott szerver', 'error', 'configStatus');
        return;
    }
    
    try {
        const response = await fetch(`/api/config/${currentGuildId}`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            document.getElementById('testMessage').value = data.test_message || '';
            showStatus('Konfiguráció betöltve', 'success', 'configStatus');
        } else {
            if (response.status === 403) {
                showStatus('Nincs jogosultságod ehhez a szerverhez', 'error', 'configStatus');
            } else {
                showStatus(data.error || 'Hiba a betöltés során', 'error', 'configStatus');
            }
        }
    } catch (error) {
        console.error('Config betöltési hiba:', error);
        showStatus('Hiba a betöltés során', 'error', 'configStatus');
    }
}

async function saveConfig() {
    if (!currentGuildId) {
        showStatus('Nincs kiválasztott szerver', 'error', 'configStatus');
        return;
    }
    
    const testMessage = document.getElementById('testMessage').value;
    
    if (!testMessage.trim()) {
        showStatus('Töltsd ki az üzenet mezőt!', 'error', 'configStatus');
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
            showStatus('Sikeresen mentve! ✨', 'success', 'configStatus');
        } else {
            if (response.status === 403) {
                showStatus('Nincs jogosultságod ehhez a szerverhez', 'error', 'configStatus');
            } else if (response.status === 401) {
                showStatus('Session lejárt, jelentkezz be újra', 'error', 'configStatus');
                setTimeout(() => window.location.href = '/auth/login', 2000);
            } else {
                showStatus(data.error || 'Hiba a mentés során', 'error', 'configStatus');
            }
        }
    } catch (error) {
        console.error('Mentési hiba:', error);
        showStatus('Hiba a mentés során', 'error', 'configStatus');
    }
}

async function loadChannels() {
    if (!currentGuildId) {
        showStatus('Nincs kiválasztott szerver', 'error', 'embedStatus');
        return;
    }
    
    const channelSelect = document.getElementById('channelSelect');
    channelSelect.innerHTML = '<option value="">Csatornák betöltése...</option>';
    
    try {
        const response = await fetch(`/api/channels/${currentGuildId}`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            channels = data.channels;
            
            if (channels.length === 0) {
                channelSelect.innerHTML = '<option value="">Nincs elérhető szöveges csatorna</option>';
                return;
            }
            
            channelSelect.innerHTML = '<option value="">Válassz csatornát...</option>' +
                channels.map(channel => 
                    `<option value="${channel.id}"># ${escapeHtml(channel.name)}</option>`
                ).join('');
        } else {
            channelSelect.innerHTML = '<option value="">Hiba a csatornák betöltésénél</option>';
            showStatus(data.error || 'Hiba a csatornák betöltése során', 'error', 'embedStatus');
        }
    } catch (error) {
        console.error('Channels betöltési hiba:', error);
        channelSelect.innerHTML = '<option value="">Hiba a csatornák betöltésénél</option>';
        showStatus('Hiba a csatornák betöltése során', 'error', 'embedStatus');
    }
}

function setupEmbedPreviewListeners() {
    const inputs = [
        'embedTitle', 'embedDescription', 'embedUrl', 'embedColor', 'embedColorHex',
        'authorName', 'authorUrl', 'authorIcon', 'footerText', 'footerIcon',
        'embedImage', 'embedThumbnail', 'embedTimestamp'
    ];
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateEmbedPreview);
            if (element.type === 'checkbox') {
                element.addEventListener('change', updateEmbedPreview);
            }
        }
    });
    
    document.getElementById('embedColor')?.addEventListener('input', (e) => {
        document.getElementById('embedColorHex').value = e.target.value;
        updateEmbedPreview();
    });
    
    document.getElementById('embedColorHex')?.addEventListener('input', (e) => {
        const hex = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(hex)) {
            document.getElementById('embedColor').value = hex;
            updateEmbedPreview();
        }
    });
}

function updateEmbedPreview() {
    const preview = document.getElementById('embedPreview');
    const color = document.getElementById('embedColor').value;
    
    const embedData = {
        title: document.getElementById('embedTitle').value,
        description: document.getElementById('embedDescription').value,
        url: document.getElementById('embedUrl').value,
        color: color,
        authorName: document.getElementById('authorName').value,
        authorUrl: document.getElementById('authorUrl').value,
        authorIcon: document.getElementById('authorIcon').value,
        footerText: document.getElementById('footerText').value,
        footerIcon: document.getElementById('footerIcon').value,
        thumbnail: document.getElementById('embedThumbnail').value,
        image: document.getElementById('embedImage').value,
        timestamp: document.getElementById('embedTimestamp').checked
    };
    
    const hasContent = embedData.title || embedData.description || embedData.authorName || 
                       embedData.footerText || embedData.image || embedData.thumbnail || embedFields.length > 0;
    
    if (!hasContent) {
        preview.innerHTML = `
            <div class="discord-embed-empty">
                <i class="fas fa-info-circle"></i>
                <p>Töltsd ki a mezőket az embed megjelenítéséhez</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="discord-embed" style="border-left-color: ' + color + '; background: ' + hexToRgba(color, 0.05) + ';">';
    
    // Thumbnail
    if (embedData.thumbnail) {
        html += `<img src="${escapeHtml(embedData.thumbnail)}" class="embed-thumbnail" onerror="this.style.display='none'">`;
    }
    
    // Author
    if (embedData.authorName) {
        html += '<div class="embed-author">';
        if (embedData.authorIcon) {
            html += `<img src="${escapeHtml(embedData.authorIcon)}" class="embed-author-icon" onerror="this.style.display='none'">`;
        }
        if (embedData.authorUrl) {
            html += `<a href="${escapeHtml(embedData.authorUrl)}" class="embed-author-name" target="_blank">${escapeHtml(embedData.authorName)}</a>`;
        } else {
            html += `<span class="embed-author-name">${escapeHtml(embedData.authorName)}</span>`;
        }
        html += '</div>';
    }
    
    // Title
    if (embedData.title) {
        if (embedData.url) {
            html += `<a href="${escapeHtml(embedData.url)}" class="embed-title" target="_blank">${escapeHtml(embedData.title)}</a>`;
        } else {
            html += `<div class="embed-title">${escapeHtml(embedData.title)}</div>`;
        }
    }
    
    // Description
    if (embedData.description) {
        html += `<div class="embed-description">${escapeHtml(embedData.description)}</div>`;
    }
    
    // Fields
    if (embedFields.length > 0) {
        html += '<div class="embed-fields">';
        embedFields.forEach(field => {
            if (field.name && field.value) {
                html += `<div class="embed-field ${field.inline ? 'inline' : ''}">`;
                html += `<div class="embed-field-name">${escapeHtml(field.name)}</div>`;
                html += `<div class="embed-field-value">${escapeHtml(field.value)}</div>`;
                html += '</div>';
            }
        });
        html += '</div>';
    }
    
    // Image
    if (embedData.image) {
        html += `<img src="${escapeHtml(embedData.image)}" class="embed-image" onerror="this.style.display='none'">`;
    }
    
    // Footer
    if (embedData.footerText || embedData.timestamp) {
        html += '<div class="embed-footer">';
        if (embedData.footerIcon) {
            html += `<img src="${escapeHtml(embedData.footerIcon)}" class="embed-footer-icon" onerror="this.style.display='none'">`;
        }
        html += '<span class="embed-footer-text">';
        if (embedData.footerText) {
            html += escapeHtml(embedData.footerText);
        }
        if (embedData.timestamp) {
            if (embedData.footerText) html += ' • ';
            html += new Date().toLocaleString('hu-HU');
        }
        html += '</span></div>';
    }
    
    html += '</div>';
    preview.innerHTML = html;
}

function addField() {
    const fieldId = Date.now();
    embedFields.push({ id: fieldId, name: '', value: '', inline: false });
    
    const container = document.getElementById('fieldsContainer');
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'field-item';
    fieldDiv.id = `field-${fieldId}`;
    
    fieldDiv.innerHTML = `
        <div class="field-header">
            <span class="field-number">Mező #${embedFields.length}</span>
            <button class="btn-remove-field" onclick="removeField(${fieldId})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="form-group">
            <label>Mező neve</label>
            <input type="text" id="fieldName-${fieldId}" placeholder="Mező neve" maxlength="256" onkeyup="updateField(${fieldId})">
        </div>
        <div class="form-group">
            <label>Mező értéke</label>
            <textarea id="fieldValue-${fieldId}" placeholder="Mező értéke" rows="3" maxlength="1024" onkeyup="updateField(${fieldId})"></textarea>
        </div>
        <div class="field-inline-group">
            <input type="checkbox" id="fieldInline-${fieldId}" onchange="updateField(${fieldId})">
            <label for="fieldInline-${fieldId}">Inline (egymás mellett)</label>
        </div>
    `;
    
    container.appendChild(fieldDiv);
}

function removeField(fieldId) {
    embedFields = embedFields.filter(f => f.id !== fieldId);
    document.getElementById(`field-${fieldId}`).remove();
    updateEmbedPreview();
}

function updateField(fieldId) {
    const field = embedFields.find(f => f.id === fieldId);
    if (field) {
        field.name = document.getElementById(`fieldName-${fieldId}`).value;
        field.value = document.getElementById(`fieldValue-${fieldId}`).value;
        field.inline = document.getElementById(`fieldInline-${fieldId}`).checked;
        updateEmbedPreview();
    }
}

async function sendEmbed() {
    if (!currentGuildId) {
        showStatus('Nincs kiválasztott szerver', 'error', 'embedStatus');
        return;
    }
    
    const channelId = document.getElementById('channelSelect').value;
    
    if (!channelId) {
        showStatus('Válassz ki egy csatornát!', 'error', 'embedStatus');
        return;
    }
    
    const embedData = {
        title: document.getElementById('embedTitle').value || undefined,
        description: document.getElementById('embedDescription').value || undefined,
        url: document.getElementById('embedUrl').value || undefined,
        color: document.getElementById('embedColor').value,
        author_name: document.getElementById('authorName').value || undefined,
        author_url: document.getElementById('authorUrl').value || undefined,
        author_icon: document.getElementById('authorIcon').value || undefined,
        footer_text: document.getElementById('footerText').value || undefined,
        footer_icon: document.getElementById('footerIcon').value || undefined,
        thumbnail: document.getElementById('embedThumbnail').value || undefined,
        image: document.getElementById('embedImage').value || undefined,
        timestamp: document.getElementById('embedTimestamp').checked ? new Date().toISOString() : undefined,
        fields: embedFields.filter(f => f.name && f.value)
    };
    
    const hasContent = embedData.title || embedData.description || embedData.author_name || 
                       embedData.footer_text || embedData.image || embedData.thumbnail || embedData.fields.length > 0;
    
    if (!hasContent) {
        showStatus('Az embed nem lehet üres! Adj hozzá legalább egy mezőt.', 'error', 'embedStatus');
        return;
    }
    
    try {
        const response = await fetch('/api/embed/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                guild_id: currentGuildId,
                channel_id: channelId,
                embed: embedData
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showStatus('Embed sikeresen elküldve! 🎉', 'success', 'embedStatus');
        } else {
            showStatus(data.error || 'Hiba az embed küldése során', 'error', 'embedStatus');
        }
    } catch (error) {
        console.error('Embed küldési hiba:', error);
        showStatus('Hiba az embed küldése során', 'error', 'embedStatus');
    }
}

function clearEmbed() {
    if (!confirm('Biztosan törölni szeretnéd az embedet?')) {
        return;
    }
    
    document.getElementById('embedTitle').value = '';
    document.getElementById('embedDescription').value = '';
    document.getElementById('embedUrl').value = '';
    document.getElementById('embedColor').value = '#5865F2';
    document.getElementById('embedColorHex').value = '#5865F2';
    document.getElementById('authorName').value = '';
    document.getElementById('authorUrl').value = '';
    document.getElementById('authorIcon').value = '';
    document.getElementById('footerText').value = '';
    document.getElementById('footerIcon').value = '';
    document.getElementById('embedThumbnail').value = '';
    document.getElementById('embedImage').value = '';
    document.getElementById('embedTimestamp').checked = false;
    
    embedFields = [];
    document.getElementById('fieldsContainer').innerHTML = '';
    
    updateEmbedPreview();
    showStatus('Embed törölve', 'info', 'embedStatus');
}

// UTILITY FUNCTIONS
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

function showStatus(message, type = 'info', elementId = 'status') {
    const statusEl = document.getElementById(elementId);
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `status show ${type}`;
    
    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 5000);
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}