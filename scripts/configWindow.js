const { ipcRenderer } = require('electron');

const dataDirectoryInput = document.getElementById('dataDirectory');
const tilesDirectoryInput = document.getElementById('tilesDirectory');
const chunkedLoadingInput = document.getElementById('chunkedLoading');
const disableClusteringAtZoomInput = document.getElementById('disableClusteringAtZoom');
const showCoverageOnHoverInput = document.getElementById('showCoverageOnHover');
const spiderfyOnMaxZoomInput = document.getElementById('spiderfyOnMaxZoom');
const browseDataButton = document.getElementById('browseData');
const browseTilesButton = document.getElementById('browseTiles');
const resetDefaultsButton = document.getElementById('resetDefaults');
const closeWindowButton = document.getElementById('closeWindow');
const statusEl = document.getElementById('status');

let saveTimer = null;
let applyingExternalConfig = false;

function showStatus(message) {
    statusEl.textContent = message;
}

function fillForm(config) {
    const poiCluster = config?.poiCluster || {};

    applyingExternalConfig = true;
    dataDirectoryInput.value = config?.dataDirectory || '';
    tilesDirectoryInput.value = config?.tilesDirectory || '';
    chunkedLoadingInput.checked = !!poiCluster.chunkedLoading;
    disableClusteringAtZoomInput.value = Number.isFinite(poiCluster.disableClusteringAtZoom)
        ? poiCluster.disableClusteringAtZoom
        : 6;
    showCoverageOnHoverInput.checked = !!poiCluster.showCoverageOnHover;
    spiderfyOnMaxZoomInput.checked = !!poiCluster.spiderfyOnMaxZoom;
    applyingExternalConfig = false;
}

function getPatchFromForm() {
    const parsedZoom = Number.parseInt(disableClusteringAtZoomInput.value, 10);

    return {
        dataDirectory: dataDirectoryInput.value,
        tilesDirectory: tilesDirectoryInput.value,
        poiCluster: {
            chunkedLoading: chunkedLoadingInput.checked,
            disableClusteringAtZoom: Number.isFinite(parsedZoom) ? parsedZoom : 6,
            showCoverageOnHover: showCoverageOnHoverInput.checked,
            spiderfyOnMaxZoom: spiderfyOnMaxZoomInput.checked,
        },
    };
}

async function saveFormConfig() {
    if (applyingExternalConfig) {
        return;
    }

    try {
        const updatedConfig = await ipcRenderer.invoke('update-app-config', getPatchFromForm());
        fillForm(updatedConfig);
        showStatus('Saved');
    } catch (error) {
        showStatus(`Save failed: ${error.message}`);
    }
}

function scheduleSave() {
    if (saveTimer) {
        clearTimeout(saveTimer);
    }

    showStatus('Saving...');
    saveTimer = setTimeout(() => {
        saveFormConfig();
    }, 250);
}

async function browseDirectory(targetInput, title) {
    try {
        const selected = await ipcRenderer.invoke('open-directory-dialog', {
            title,
            defaultPath: targetInput.value,
        });

        if (selected) {
            targetInput.value = selected;
            scheduleSave();
        }
    } catch (error) {
        showStatus(`Browse failed: ${error.message}`);
    }
}

async function resetDefaults() {
    try {
        const defaults = await ipcRenderer.invoke('update-app-config', {
            dataDirectory: '',
            tilesDirectory: '',
            poiCluster: {
                chunkedLoading: true,
                disableClusteringAtZoom: 6,
                showCoverageOnHover: false,
                spiderfyOnMaxZoom: false,
            },
        });
        fillForm(defaults);
        showStatus('Defaults restored');
    } catch (error) {
        showStatus(`Reset failed: ${error.message}`);
    }
}

[dataDirectoryInput, tilesDirectoryInput, disableClusteringAtZoomInput].forEach((input) => {
    input.addEventListener('input', scheduleSave);
});

[chunkedLoadingInput, showCoverageOnHoverInput, spiderfyOnMaxZoomInput].forEach((input) => {
    input.addEventListener('change', scheduleSave);
});

browseDataButton.addEventListener('click', () => browseDirectory(dataDirectoryInput, 'Select data directory'));
browseTilesButton.addEventListener('click', () => browseDirectory(tilesDirectoryInput, 'Select tiles directory'));
resetDefaultsButton.addEventListener('click', resetDefaults);
closeWindowButton.addEventListener('click', () => window.close());

ipcRenderer.on('app-config-updated', (_event, config) => {
    fillForm(config);
    showStatus('Updated');
});

ipcRenderer.invoke('get-app-config').then((config) => {
    fillForm(config);
    showStatus('Ready');
}).catch((error) => {
    showStatus(`Unable to load config: ${error.message}`);
});
