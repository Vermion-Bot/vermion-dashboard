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
        { icon: 'embedGuildIcon', name: 'embedGuildName', id: 'embedGuildId' },
        { icon: 'dropdownGuildIcon', name: 'dropdownGuildName', id: 'dropdownGuildId' }
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
    } else if (currentSection === 'list') {
        document.getElementById('listSection').style.display = 'block';
        loadChannelsForDropdown();
    }
}