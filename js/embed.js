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