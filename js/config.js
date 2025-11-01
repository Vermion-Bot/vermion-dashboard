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