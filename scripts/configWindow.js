// scripts/configWindow.js
// Drives the configuration window UI (config.html).
// Reads the current config via IPC on load, updates it on every form change
// with a short debounce, and reflects external updates broadcast by the main
// process.

const { ipcRenderer } = require('electron')

// ─── DOM References ───────────────────────────────────────────────────────────

const dataDirectoryInput          = document.getElementById('dataDirectory')
const tilesDirectoryInput         = document.getElementById('tilesDirectory')
const chunkedLoadingInput         = document.getElementById('chunkedLoading')
const disableClusteringAtZoomInput = document.getElementById('disableClusteringAtZoom')
const showCoverageOnHoverInput    = document.getElementById('showCoverageOnHover')
const spiderfyOnMaxZoomInput      = document.getElementById('spiderfyOnMaxZoom')
const browseDataButton            = document.getElementById('browseData')
const browseTilesButton           = document.getElementById('browseTiles')
const resetDefaultsButton         = document.getElementById('resetDefaults')
const closeWindowButton           = document.getElementById('closeWindow')
const statusEl                    = document.getElementById('status')

// ─── State ────────────────────────────────────────────────────────────────────

let saveTimer = null

// Flag used to suppress the scheduleSave() calls that fire when fillForm()
// programmatically changes input values (which would trigger an unnecessary save).
let applyingExternalConfig = false

// ─── Status Display ───────────────────────────────────────────────────────────

/** Shows a short status message below the form. */
function showStatus(message) {
    statusEl.textContent = message
}

// ─── Form ↔ Config Helpers ────────────────────────────────────────────────────

/**
 * Populates every form field from the given config object.
 * Sets `applyingExternalConfig` for the duration so that the `input`/`change`
 * listeners do not trigger a redundant save.
 *
 * @param {object} config
 */
function fillForm(config) {
    const poiCluster = config?.poiCluster || {}

    applyingExternalConfig = true
    dataDirectoryInput.value = config?.dataDirectory || ''
    tilesDirectoryInput.value = config?.tilesDirectory || ''
    chunkedLoadingInput.checked = !!poiCluster.chunkedLoading
    disableClusteringAtZoomInput.value = Number.isFinite(poiCluster.disableClusteringAtZoom)
        ? poiCluster.disableClusteringAtZoom
        : 6
    showCoverageOnHoverInput.checked = !!poiCluster.showCoverageOnHover
    spiderfyOnMaxZoomInput.checked = !!poiCluster.spiderfyOnMaxZoom
    applyingExternalConfig = false
}

/**
 * Reads the current form field values and returns them as a config patch object
 * that can be sent to the main process via `update-app-config`.
 *
 * @returns {object}
 */
function getPatchFromForm() {
    const parsedZoom = Number.parseInt(disableClusteringAtZoomInput.value, 10)

    return {
        dataDirectory: dataDirectoryInput.value,
        tilesDirectory: tilesDirectoryInput.value,
        poiCluster: {
            chunkedLoading: chunkedLoadingInput.checked,
            disableClusteringAtZoom: Number.isFinite(parsedZoom) ? parsedZoom : 6,
            showCoverageOnHover: showCoverageOnHoverInput.checked,
            spiderfyOnMaxZoom: spiderfyOnMaxZoomInput.checked,
        },
    }
}

// ─── Save Logic ───────────────────────────────────────────────────────────────

/**
 * Sends the current form values to the main process and refreshes the form
 * with the sanitized response so the UI stays in sync.
 */
async function saveFormConfig() {
    if (applyingExternalConfig) {
        return
    }

    try {
        const updatedConfig = await ipcRenderer.invoke('update-app-config', getPatchFromForm())
        fillForm(updatedConfig)
        showStatus('Saved')
    } catch (error) {
        showStatus(`Save failed: ${error.message}`)
    }
}

/**
 * Schedules a save after a short debounce delay so that rapid typing does not
 * flood the main process with IPC calls.
 */
function scheduleSave() {
    if (saveTimer) {
        clearTimeout(saveTimer)
    }

    showStatus('Saving...')
    saveTimer = setTimeout(() => {
        saveFormConfig()
    }, 250)
}

// ─── Directory Browser ────────────────────────────────────────────────────────

/**
 * Opens the OS folder-picker dialog and writes the selected path into the
 * target input field, then triggers an immediate save.
 *
 * @param {HTMLInputElement} targetInput The field to update with the chosen path.
 * @param {string}           title      Title string for the dialog window.
 */
async function browseDirectory(targetInput, title) {
    try {
        const selected = await ipcRenderer.invoke('open-directory-dialog', {
            title,
            defaultPath: targetInput.value,
        })

        if (selected) {
            targetInput.value = selected
            scheduleSave()
        }
    } catch (error) {
        showStatus(`Browse failed: ${error.message}`)
    }
}

// ─── Reset Defaults ───────────────────────────────────────────────────────────

/**
 * Resets all config fields to their default values by sending an empty-string
 * patch for the directory fields (the main process resolves them to defaults).
 */
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
        })
        fillForm(defaults)
        showStatus('Defaults restored')
    } catch (error) {
        showStatus(`Reset failed: ${error.message}`)
    }
}

// ─── Event Listeners ──────────────────────────────────────────────────────────

// Schedule a save whenever any text/number input value changes.
;[dataDirectoryInput, tilesDirectoryInput, disableClusteringAtZoomInput].forEach((input) => {
    input.addEventListener('input', scheduleSave)
})

// Schedule a save whenever any checkbox value changes.
;[chunkedLoadingInput, showCoverageOnHoverInput, spiderfyOnMaxZoomInput].forEach((input) => {
    input.addEventListener('change', scheduleSave)
})

browseDataButton.addEventListener('click', () => browseDirectory(dataDirectoryInput, 'Select data directory'))
browseTilesButton.addEventListener('click', () => browseDirectory(tilesDirectoryInput, 'Select tiles directory'))
resetDefaultsButton.addEventListener('click', resetDefaults)
closeWindowButton.addEventListener('click', () => window.close())

// Reflect config changes broadcast by the main process (e.g. from another window).
ipcRenderer.on('app-config-updated', (_event, config) => {
    fillForm(config)
    showStatus('Updated')
})

// ─── Initialisation ───────────────────────────────────────────────────────────

// Fetch the current config and populate the form as soon as the window opens.
ipcRenderer.invoke('get-app-config').then((config) => {
    fillForm(config)
    showStatus('Ready')
}).catch((error) => {
    showStatus(`Unable to load config: ${error.message}`)
})
