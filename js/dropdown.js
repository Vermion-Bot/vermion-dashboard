let dropdownOptions = [];

function setupDropdownPreviewListeners() {
    const inputs = [
        'dropdownMessage', 'dropdownCustomId', 'dropdownPlaceholder',
        'dropdownMinValues', 'dropdownMaxValues'
    ];
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateDropdownPreview);
            if (element.type === 'number') {
                element.addEventListener('change', updateDropdownPreview);
            }
        }
    });
}

function updateDropdownPreview() {
    const messagePreview = document.getElementById('dropdownMessagePreview');
    const preview = document.getElementById('dropdownPreview');
    
    const message = document.getElementById('dropdownMessage').value;
    const placeholder = document.getElementById('dropdownPlaceholder').value || 'Válassz egy opciót...';
    
    if (message) {
        messagePreview.textContent = message;
        messagePreview.style.display = 'block';
    } else {
        messagePreview.style.display = 'none';
    }
    
    if (dropdownOptions.length === 0) {
        preview.innerHTML = `
            <div class="dropdown-empty">
                <i class="fas fa-info-circle"></i>
                <p>Adj hozzá opciókat a dropdown megjelenítéséhez</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="discord-select-menu">';
    html += '<div class="discord-select-placeholder">';
    html += `<span>${escapeHtml(placeholder)}</span>`;
    html += '<i class="fas fa-chevron-down"></i>';
    html += '</div>';
    html += '<div class="discord-select-options">';
    
    dropdownOptions.forEach(option => {
        if (option.label && option.value) {
            html += `<div class="discord-select-option ${option.default ? 'default' : ''}">`;
            html += '<div class="discord-option-label">';
            
            if (option.emoji) {
                html += `<span class="discord-option-emoji">${escapeHtml(option.emoji)}</span>`;
            }
            
            html += `<span>${escapeHtml(option.label)}</span>`;
            
            if (option.default) {
                html += '<span class="discord-option-default-badge">Alapértelmezett</span>';
            }
            
            html += '</div>';
            
            if (option.description) {
                html += `<div class="discord-option-description">${escapeHtml(option.description)}</div>`;
            }
            
            html += '</div>';
        }
    });
    
    html += '</div></div>';
    preview.innerHTML = html;
}

function addDropdownOption() {
    const optionId = Date.now();
    dropdownOptions.push({ 
        id: optionId, 
        label: '', 
        value: '', 
        description: '', 
        emoji: '', 
        default: false 
    });
    
    const container = document.getElementById('dropdownOptionsContainer');
    const optionDiv = document.createElement('div');
    optionDiv.className = 'dropdown-option-item';
    optionDiv.id = `dropdown-option-${optionId}`;
    
    optionDiv.innerHTML = `
        <div class="dropdown-option-header">
            <span class="dropdown-option-number">Opció #${dropdownOptions.length}</span>
            <button class="btn-remove-option" onclick="removeDropdownOption(${optionId})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="form-group">
            <label>Címke (Label) *</label>
            <input type="text" id="optionLabel-${optionId}" placeholder="Opció neve" maxlength="100" onkeyup="updateDropdownOption(${optionId})">
        </div>
        <div class="form-group">
            <label>Érték (Value) *</label>
            <input type="text" id="optionValue-${optionId}" placeholder="option_value" maxlength="100" onkeyup="updateDropdownOption(${optionId})">
            <p class="field-description">Ez az érték kerül a bot-hoz amikor ezt az opciót választják</p>
        </div>
        <div class="form-group">
            <label>Leírás (opcionális)</label>
            <textarea id="optionDescription-${optionId}" placeholder="Opció leírása..." rows="2" maxlength="100" onkeyup="updateDropdownOption(${optionId})"></textarea>
        </div>
        <div class="form-group">
            <label>Emoji (opcionális)</label>
            <input type="text" id="optionEmoji-${optionId}" placeholder="😀" maxlength="10" onkeyup="updateDropdownOption(${optionId})">
            <p class="field-description">Egy emoji karakter (pl: 😀, 🎉, ⭐)</p>
        </div>
        <div class="dropdown-option-default">
            <input type="checkbox" id="optionDefault-${optionId}" onchange="updateDropdownOption(${optionId})">
            <label for="optionDefault-${optionId}">Alapértelmezetten kiválasztva</label>
        </div>
    `;
    
    container.appendChild(optionDiv);
    updateDropdownPreview();
}

function removeDropdownOption(optionId) {
    dropdownOptions = dropdownOptions.filter(opt => opt.id !== optionId);
    document.getElementById(`dropdown-option-${optionId}`).remove();
    
    const container = document.getElementById('dropdownOptionsContainer');
    const optionItems = container.querySelectorAll('.dropdown-option-item');
    optionItems.forEach((item, index) => {
        const numberSpan = item.querySelector('.dropdown-option-number');
        if (numberSpan) {
            numberSpan.textContent = `Opció #${index + 1}`;
        }
    });
    
    updateDropdownPreview();
}

function updateDropdownOption(optionId) {
    const option = dropdownOptions.find(opt => opt.id === optionId);
    if (option) {
        option.label = document.getElementById(`optionLabel-${optionId}`).value;
        option.value = document.getElementById(`optionValue-${optionId}`).value;
        option.description = document.getElementById(`optionDescription-${optionId}`).value;
        option.emoji = document.getElementById(`optionEmoji-${optionId}`).value;
        option.default = document.getElementById(`optionDefault-${optionId}`).checked;
        updateDropdownPreview();
    }
}

async function sendDropdown() {
    if (!currentGuildId) {
        showStatus('Nincs kiválasztott szerver', 'error', 'dropdownStatus');
        return;
    }
    
    const channelId = document.getElementById('dropdownChannelSelect').value;
    
    if (!channelId) {
        showStatus('Válassz ki egy csatornát!', 'error', 'dropdownStatus');
        return;
    }
    
    if (dropdownOptions.length === 0) {
        showStatus('Legalább 1 opció szükséges!', 'error', 'dropdownStatus');
        return;
    }
    
    if (dropdownOptions.length > 25) {
        showStatus('Maximum 25 opció lehet!', 'error', 'dropdownStatus');
        return;
    }
    
    const invalidOptions = dropdownOptions.filter(opt => !opt.label || !opt.value);
    if (invalidOptions.length > 0) {
        showStatus('Minden opciónak kell label és value!', 'error', 'dropdownStatus');
        return;
    }
    
    const minValues = parseInt(document.getElementById('dropdownMinValues').value) || 1;
    const maxValues = parseInt(document.getElementById('dropdownMaxValues').value) || 1;
    
    if (minValues > maxValues) {
        showStatus('A minimum nem lehet nagyobb mint a maximum!', 'error', 'dropdownStatus');
        return;
    }
    
    if (maxValues > dropdownOptions.length) {
        showStatus('A maximum nem lehet több mint az opciók száma!', 'error', 'dropdownStatus');
        return;
    }
    
    const dropdownData = {
        message: document.getElementById('dropdownMessage').value || null,
        custom_id: document.getElementById('dropdownCustomId').value || `dropdown_${currentGuildId}_${channelId}`,
        placeholder: document.getElementById('dropdownPlaceholder').value || 'Válassz egy opciót...',
        min_values: minValues,
        max_values: maxValues,
        options: dropdownOptions.map(opt => ({
            label: opt.label,
            value: opt.value,
            description: opt.description || undefined,
            emoji: opt.emoji || undefined,
            default: opt.default || undefined
        }))
    };
    
    try {
        const response = await fetch('/api/dropdown/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                guild_id: currentGuildId,
                channel_id: channelId,
                dropdown: dropdownData
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showStatus('Dropdown sikeresen elküldve! 🎉', 'success', 'dropdownStatus');
        } else {
            showStatus(data.error || 'Hiba a dropdown küldése során', 'error', 'dropdownStatus');
        }
    } catch (error) {
        console.error('Dropdown küldési hiba:', error);
        showStatus('Hiba a dropdown küldése során', 'error', 'dropdownStatus');
    }
}

function clearDropdown() {
    if (!confirm('Biztosan törölni szeretnéd a dropdown-ot?')) {
        return;
    }
    
    document.getElementById('dropdownMessage').value = '';
    document.getElementById('dropdownCustomId').value = '';
    document.getElementById('dropdownPlaceholder').value = '';
    document.getElementById('dropdownMinValues').value = '1';
    document.getElementById('dropdownMaxValues').value = '1';
    
    dropdownOptions = [];
    document.getElementById('dropdownOptionsContainer').innerHTML = '';
    
    updateDropdownPreview();
    showStatus('Dropdown törölve', 'info', 'dropdownStatus');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDropdownPreviewListeners);
} else {
    setupDropdownPreviewListeners();
}