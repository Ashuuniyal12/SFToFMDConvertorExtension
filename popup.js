document.addEventListener('DOMContentLoaded', () => {
    // UI References
    const statusMsg = document.getElementById('statusMsg');
    const fieldsBody = document.getElementById('fieldsBody');
    const mappingBody = document.getElementById('mappingBody');
    const searchFields = document.getElementById('searchFields');
    const selectAll = document.getElementById('selectAll');
    const currentObjectSpan = document.getElementById('currentObject');
    const generateBtn = document.getElementById('generateBtn');
    const addVirtualFieldBtn = document.getElementById('addVirtualFieldBtn');
    const saveMappingBtn = document.getElementById('saveMappingBtn');
    const resetMappingBtn = document.getElementById('resetMappingBtn');

    // State
    let currentFields = [];
    let currentObject = null;
    let sessionId = null;
    let instanceUrl = null;
    let mappingEngine = new window.MappingEngine();
    let excelGenerator = new window.ExcelGenerator();

    // Theme Handling (Already in initial skeleton, but verifying)
    const tempTheme = localStorage.getItem('theme') || 'light';
    if (tempTheme === 'dark') {
        document.body.classList.add('dark-mode');
        // Icon will be set by the logic at bottom of file or we can set it here if we move logic up.
        // For now, let's leave the textContent dummy and let the bottom logic handle overwrite.
    }

    // --- Initialization ---

    async function init() {
        try {
            statusMsg.textContent = "Detecting Context...";

            // 1. Get Tab URL to detect Mode
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                statusMsg.textContent = "No active tab.";
                return;
            }

            // 2. Ask Background for Session (easiest way to get cookies)
            const response = await chrome.runtime.sendMessage({ action: "GET_SESSION_ID", url: tab.url });

            if (!response || !response.sid) {
                statusMsg.textContent = "Not logged in or Session not found.";
                console.warn("Session ID missing. Ensure you are on a Salesforce page.");
                // For dev/testing, we might proceed if we mock, but strict requirement says detect session.
                // We will try to detect object name anyway.
            } else {
                sessionId = response.sid;
                instanceUrl = response.instanceUrl;
                statusMsg.textContent = "Session Found.";
            }

            // 3. Ask Content Script for Object Name
            // We need to inject content script if not already running, but manifest injects it.
            try {
                let contextResp;
                try {
                    contextResp = await chrome.tabs.sendMessage(tab.id, { action: "GET_OBJECT_CONTEXT" });
                } catch (msgErr) {
                    // If content script is not present (e.g. reload or first install), inject it
                    console.log("Injecting content script...");
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    });
                    // Retry message
                    contextResp = await chrome.tabs.sendMessage(tab.id, { action: "GET_OBJECT_CONTEXT" });
                }

                if (contextResp && contextResp.objectName) {
                    currentObject = contextResp.objectName;
                    currentObjectSpan.textContent = currentObject;
                    statusMsg.textContent = `Object: ${currentObject}`;

                    if (sessionId) {
                        fetchFields(currentObject);
                    }
                } else {
                    currentObjectSpan.textContent = "Not found (Open an Object)";
                    statusMsg.textContent = "Please go to Setup > Object Manager > [Object]";
                }
            } catch (err) {
                console.error("Content script error:", err);
                statusMsg.textContent = "Reload page or navigate to SF.";
            }

        } catch (e) {
            console.error(e);
            statusMsg.textContent = "Error initializing.";
        }

        renderMappingRules();
    }

    // --- Logic ---

    async function fetchFields(objectName) {
        statusMsg.textContent = "Fetching Metadata...";
        try {
            const api = new window.SalesforceApi(instanceUrl, sessionId);
            const metadata = await api.describe(objectName);

            // Transform to flat list
            currentFields = metadata.fields.map(f => ({
                name: f.name,
                label: f.label,
                type: f.type,
                length: f.length,
                precision: f.precision,
                scale: f.scale,
                nillable: f.nillable,
                selected: true // Default select all
            }));

            renderFields();
            statusMsg.textContent = `Loaded ${currentFields.length} fields.`;
        } catch (e) {
            console.error("Describe error:", e);
            statusMsg.textContent = `Error: ${e.message}`; // Show actual error
        }
    }

    // --- Rendering ---

    function renderFields() {
        fieldsBody.innerHTML = '';
        const filter = searchFields.value.toLowerCase();

        currentFields.forEach((field, index) => {
            if (field.name.toLowerCase().includes(filter) || field.label.toLowerCase().includes(filter)) {
                const tr = document.createElement('tr');

                tr.innerHTML = `
                    <td><input type="checkbox" data-index="${index}" ${field.selected ? 'checked' : ''}></td>
                    <td>${field.name}</td>
                    <td>${field.label}</td>
                    <td>${field.type}</td>
                    <td>${field.length || ''}</td>
                `;
                fieldsBody.appendChild(tr);
            }
        });

        // Re-attach listeners to new checkboxes
        fieldsBody.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const idx = e.target.getAttribute('data-index');
                if (idx !== null) {
                    currentFields[idx].selected = e.target.checked;
                }
            });
        });
    }

    // --- Events ---

    // Search
    searchFields.addEventListener('input', () => {
        // Debounce could be added here
        renderFields();
    });

    // Select All
    selectAll.addEventListener('change', (e) => {
        const checked = e.target.checked;
        currentFields.forEach(f => f.selected = checked);
        renderFields();
    });

    // Add Virtual Field Modal Logic
    const modal = document.getElementById('virtualFieldModal');
    const vfApiName = document.getElementById('vfApiName');
    const vfLabel = document.getElementById('vfLabel');
    const vfType = document.getElementById('vfType');
    const vfLength = document.getElementById('vfLength');
    const vfOkBtn = document.getElementById('vfOkBtn');
    const vfCancelBtn = document.getElementById('vfCancelBtn');

    addVirtualFieldBtn.addEventListener('click', () => {
        // Reset and Open
        vfApiName.value = '';
        vfLabel.value = '';
        vfType.value = 'string';
        vfLength.value = '255';
        modal.classList.remove('hidden');
        vfApiName.focus();
    });

    vfCancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    vfOkBtn.addEventListener('click', () => {
        const name = vfApiName.value.trim();
        const label = vfLabel.value.trim();
        const type = vfType.value;
        const length = vfLength.value ? parseInt(vfLength.value) : 255;

        // Validation
        if (!name || !label || !type) {
            alert("Please fill in all mandatory fields (API Name, Label, Type).");
            return;
        }

        const newField = {
            name: name,
            label: label,
            type: type,
            length: length,
            precision: 0,
            scale: 0,
            nillable: true,
            selected: true,
            isVirtual: true
        };

        currentFields.unshift(newField);
        renderFields();
        modal.classList.add('hidden');
    });

    // Generate
    generateBtn.addEventListener('click', async () => {
        const selected = currentFields.filter(f => f.selected);
        if (selected.length === 0) {
            alert("Please select at least one field.");
            return;
        }

        statusMsg.textContent = "Generating Excel...";
        try {
            const config = {
                dataset: "Salesforce_Data", // Could be an input
                table: currentObject ? currentObject.toLowerCase() : "output_table"
            };

            const buffer = await excelGenerator.generateFMD(currentObject || "Export", selected, mappingEngine, config);

            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            const filename = `FMD_${currentObject || "Export"}_${dateStr}.xlsx`;

            excelGenerator.downloadExcel(buffer, filename);
            statusMsg.textContent = "Download started.";
        } catch (e) {
            console.error(e);
            statusMsg.textContent = "Error generating Excel.";
        }
    });

    // Mapping Rules
    async function renderMappingRules() {
        mappingBody.innerHTML = '';
        // Wait for mappings to load
        await mappingEngine.loadMappings();
        const mappings = mappingEngine.mappings;

        Object.keys(mappings).forEach(sfType => {
            const bqType = mappings[sfType];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${sfType}</td>
                <td>
                    <select data-sftype="${sfType}">
                        <option value="STRING" ${bqType === 'STRING' ? 'selected' : ''}>STRING</option>
                        <option value="NUMERIC" ${bqType === 'NUMERIC' ? 'selected' : ''}>NUMERIC</option>
                        <option value="BOOL" ${bqType === 'BOOL' ? 'selected' : ''}>BOOL</option>
                        <option value="DATE" ${bqType === 'DATE' ? 'selected' : ''}>DATE</option>
                        <option value="TIMESTAMP" ${bqType === 'TIMESTAMP' ? 'selected' : ''}>TIMESTAMP</option>
                        <option value="BYTES" ${bqType === 'BYTES' ? 'selected' : ''}>BYTES</option>
                    </select>
                </td>
            `;
            mappingBody.appendChild(tr);
        });
    }

    saveMappingBtn.addEventListener('click', async () => {
        const newMappings = {};
        mappingBody.querySelectorAll('select').forEach(sel => {
            const sfType = sel.getAttribute('data-sftype');
            newMappings[sfType] = sel.value;
        });
        await mappingEngine.saveMappings(newMappings);
        alert("Mappings Saved!");
    });

    resetMappingBtn.addEventListener('click', async () => {
        if (confirm("Reset all mappings to default?")) {
            await mappingEngine.resetMappings();
            renderMappingRules();
        }
    });

    // SVG Icons
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    // Theme Toggle
    const themeToggleBtn = document.getElementById('themeToggle');

    // Set initial icon based on loaded theme
    if (document.body.classList.contains('dark-mode')) {
        themeToggleBtn.innerHTML = sunIcon;
    } else {
        themeToggleBtn.innerHTML = moonIcon;
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggleBtn.innerHTML = isDark ? sunIcon : moonIcon;
    });

    // Tab Switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Basic tab logic handled in HTML/inline script in skeleton, 
            // but here we ensure full logic if we replaced it.
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.remove('hidden');
        });
    });

    // Start
    init();
});
