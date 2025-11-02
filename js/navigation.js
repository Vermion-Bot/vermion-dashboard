function showSection(section) {
    currentSection = section;
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    document.getElementById('configSection').style.display = 'none';
    document.getElementById('embedSection').style.display = 'none';
    document.getElementById('listSection').style.display = 'none';
    
    if (!currentGuildId) {
        document.getElementById('noGuildSelected').style.display = 'flex';
        return;
    }
    
    document.getElementById('noGuildSelected').style.display = 'none';
    
    if (section === 'config') {
        document.getElementById('configSection').style.display = 'block';
        loadConfig();
    } else if (section === 'embed') {
        document.getElementById('embedSection').style.display = 'block';
        loadChannels();
    } else if (section === 'list') {
        document.getElementById('listSection').style.display = 'block';
        loadChannelsForDropdown();
    }
}