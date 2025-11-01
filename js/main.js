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