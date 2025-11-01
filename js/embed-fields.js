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