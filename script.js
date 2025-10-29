async function saveConfig() {
    const guildId = document.getElementById('guildId').value;
    const testMessage = document.getElementById('testMessage').value;
    const statusEl = document.getElementById('status');

    if (!guildId || !testMessage) {
        statusEl.textContent = '❌ Töltsd ki mindkét mezőt!';
        return;
    }

    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guild_id: guildId,
                test_message: testMessage
            })
        });

        if (response.ok) {
            statusEl.textContent = '✅ Sikeresen mentve!';
        } else {
            statusEl.textContent = '❌ Hiba a mentés során!';
        }
    } catch (error) {
        statusEl.textContent = '❌ Hiba: ' + error.message;
    }
}

async function loadConfig() {
    const guildId = document.getElementById('guildId').value;
    const statusEl = document.getElementById('status');

    if (!guildId) {
        statusEl.textContent = '❌ Add meg a Guild ID-t!';
        return;
    }

    try {
        const response = await fetch(`/api/config/${guildId}`);
        const data = await response.json();

        if (data.test_message) {
            document.getElementById('testMessage').value = data.test_message;
            statusEl.textContent = '✅ Betöltve!';
        } else {
            statusEl.textContent = '❌ Nincs adat erre a Guild ID-ra!';
        }
    } catch (error) {
        statusEl.textContent = '❌ Hiba: ' + error.message;
    }
}