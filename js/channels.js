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