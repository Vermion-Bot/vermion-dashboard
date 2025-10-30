let currentGuildId = null;
let currentToken = null;

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        guild_id: params.get('guild_id'),
        token: params.get('token')
    };
}

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status show ${type}`;
}

async function saveConfig() {
    const testMessage = document.getElementById('testMessage').value;

    if (!testMessage.trim()) {
        showStatus('Töltsd ki az üzenet mezőt!', 'error');
        return;
    }

    if (!currentToken || !currentGuildId) {
        showStatus('Token vagy Guild ID hiányzik!', 'error');
        return;
    }

    try {        
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guild_id: currentGuildId, 
                token: currentToken,
                test_message: testMessage
            })
        });

        const data = await response.json();

        if (response.ok) {
            showStatus('Sikeresen mentve!', 'success');
        } else {
            showStatus(`Hiba: ${data.error || 'Ismeretlen hiba'}`, 'error');
        }
    } catch (error) {
        showStatus(`Hiba: ${error.message}`, 'error');
    }
}

async function loadConfig() {
    if (!currentToken || !currentGuildId) {
        showStatus('Token vagy Guild ID hiányzik!', 'error');
        return;
    }

    try {        
        const response = await fetch(`/api/config/${currentGuildId}`);
        const data = await response.json();

        if (response.ok && data.test_message) {
            document.getElementById('testMessage').value = data.test_message;
            showStatus('Betöltve!', 'success');
        } else {
            showStatus(`${data.error || 'Nincs adat erre a szerverhez!'}`, 'error');
        }
    } catch (error) {
        showStatus(`Hiba: ${error.message}`, 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const { guild_id, token } = getUrlParams();
    
    currentGuildId = guild_id;
    currentToken = token;
    
    const guildInfoEl = document.getElementById('guildInfo');
    const guildIdDisplay = document.getElementById('guildIdDisplay');

    if (!guild_id || !token) {
        showStatus('Hiányzó guild_id vagy token az URL-ből!', 'error');
        document.querySelectorAll('button').forEach(btn => btn.disabled = true);
    } else {
        guildInfoEl.style.display = 'block';
        guildIdDisplay.textContent = guild_id;
        showStatus('Bejelentkezve. Kész a konfigurálásra.', 'success');
    }
});