// electron/configStore.js
// Handles all configuration file operations: path resolution, default values,
// validation, reading/writing config.json, and broadcasting updates to all
// open renderer windows.

const { app, BrowserWindow } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

// ─── Config Keys ─────────────────────────────────────────────────────────────

const CONFIG_FILE = 'config.json'
const CONFIG_KEY_DATA_DIR = 'dataDirectory'
const CONFIG_KEY_TILES_DIR = 'tilesDirectory'
const CONFIG_KEY_POI_CLUSTER = 'poiCluster'

// ─── Path Helpers ─────────────────────────────────────────────────────────────

/** Returns the default data directory bundled inside the application. */
function getDefaultDataDirectory() {
    return path.join(app.getAppPath(), 'data')
}

/**
 * Returns the default tiles directory.
 * When packaged, tiles live next to the executable so they can be excluded
 * from the ASAR archive and replaced without rebuilding the app.
 */
function getDefaultTilesDirectory() {
    if (app.isPackaged) {
        return path.join(path.dirname(process.execPath), 'tiles')
    }
    return path.join(app.getAppPath(), 'tiles')
}

/**
 * Returns the file path of config.json.
 * In development this sits inside `out/`; in production next to the executable.
 */
function getConfigFilePath() {
    if (app.isPackaged) {
        return path.join(path.dirname(process.execPath), CONFIG_FILE)
    }
    return path.join(app.getAppPath(), 'out', CONFIG_FILE)
}

// ─── Defaults & Sanitization ──────────────────────────────────────────────────

/** Returns a fresh config object with every field set to its default value. */
function getDefaultConfig() {
    return {
        [CONFIG_KEY_DATA_DIR]: getDefaultDataDirectory(),
        [CONFIG_KEY_TILES_DIR]: getDefaultTilesDirectory(),
        [CONFIG_KEY_POI_CLUSTER]: {
            chunkedLoading: true,
            disableClusteringAtZoom: 6,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: false,
        },
    }
}

/**
 * Validates and normalizes a raw config value.
 * Unknown, missing, or invalid fields are replaced with their defaults so the
 * rest of the application always receives a fully-formed config object.
 *
 * @param {unknown} rawConfig
 * @returns {object} A valid, fully-formed config object.
 */
function sanitizeConfig(rawConfig) {
    const defaults = getDefaultConfig()
    const sanitized = {
        [CONFIG_KEY_DATA_DIR]: defaults[CONFIG_KEY_DATA_DIR],
        [CONFIG_KEY_TILES_DIR]: defaults[CONFIG_KEY_TILES_DIR],
        [CONFIG_KEY_POI_CLUSTER]: { ...defaults[CONFIG_KEY_POI_CLUSTER] },
    }

    if (!rawConfig || typeof rawConfig !== 'object' || Array.isArray(rawConfig)) {
        return sanitized
    }

    if (typeof rawConfig[CONFIG_KEY_DATA_DIR] === 'string' && rawConfig[CONFIG_KEY_DATA_DIR].trim() !== '') {
        sanitized[CONFIG_KEY_DATA_DIR] = rawConfig[CONFIG_KEY_DATA_DIR]
    }

    if (typeof rawConfig[CONFIG_KEY_TILES_DIR] === 'string' && rawConfig[CONFIG_KEY_TILES_DIR].trim() !== '') {
        sanitized[CONFIG_KEY_TILES_DIR] = rawConfig[CONFIG_KEY_TILES_DIR]
    }

    const rawCluster = rawConfig[CONFIG_KEY_POI_CLUSTER]
    if (rawCluster && typeof rawCluster === 'object' && !Array.isArray(rawCluster)) {
        if (typeof rawCluster.chunkedLoading === 'boolean') {
            sanitized[CONFIG_KEY_POI_CLUSTER].chunkedLoading = rawCluster.chunkedLoading
        }
        if (typeof rawCluster.disableClusteringAtZoom === 'number' && Number.isFinite(rawCluster.disableClusteringAtZoom)) {
            sanitized[CONFIG_KEY_POI_CLUSTER].disableClusteringAtZoom = rawCluster.disableClusteringAtZoom
        }
        if (typeof rawCluster.showCoverageOnHover === 'boolean') {
            sanitized[CONFIG_KEY_POI_CLUSTER].showCoverageOnHover = rawCluster.showCoverageOnHover
        }
        if (typeof rawCluster.spiderfyOnMaxZoom === 'boolean') {
            sanitized[CONFIG_KEY_POI_CLUSTER].spiderfyOnMaxZoom = rawCluster.spiderfyOnMaxZoom
        }
    }

    return sanitized
}

// ─── File I/O ─────────────────────────────────────────────────────────────────

/**
 * Ensures config.json exists and contains valid data.
 * Creates it with defaults if it is missing; repairs it if the content is
 * corrupt or contains invalid fields.
 */
function ensureConfigFile() {
    const configPath = getConfigFilePath()
    fs.mkdirSync(path.dirname(configPath), { recursive: true })

    const defaultConfig = getDefaultConfig()

    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8')
        return
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        const sanitized = sanitizeConfig(parsed)
        // Overwrite the file only when sanitization actually changed something.
        if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
            fs.writeFileSync(configPath, JSON.stringify(sanitized, null, 2), 'utf8')
        }
    } catch {
        // The file is corrupt — reset it to defaults.
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8')
    }
}

/** Reads and sanitizes config.json, falling back to defaults on any error. */
function loadConfig() {
    const configPath = getConfigFilePath()
    try {
        if (!fs.existsSync(configPath)) {
            return getDefaultConfig()
        }
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        return sanitizeConfig(parsed)
    } catch {
        return getDefaultConfig()
    }
}

/** Sanitizes the given config object and writes it to disk. */
function saveConfig(config) {
    const sanitized = sanitizeConfig(config)
    fs.writeFileSync(getConfigFilePath(), JSON.stringify(sanitized, null, 2), 'utf8')
}

// ─── Config Update Pipeline ───────────────────────────────────────────────────

/**
 * Deeply merges a partial patch into the provided base config.
 * Unknown or invalid patch fields are ignored; the result is always sanitized.
 *
 * @param {object} currentConfig The full current config.
 * @param {object} patch         Partial config values to apply.
 * @returns {object} The sanitized merged config.
 */
function mergeConfigPatch(currentConfig, patch) {
    const merged = {
        ...currentConfig,
        [CONFIG_KEY_POI_CLUSTER]: { ...currentConfig[CONFIG_KEY_POI_CLUSTER] },
    }

    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
        return sanitizeConfig(merged)
    }

    if (typeof patch[CONFIG_KEY_DATA_DIR] === 'string') {
        merged[CONFIG_KEY_DATA_DIR] = patch[CONFIG_KEY_DATA_DIR]
    }

    if (typeof patch[CONFIG_KEY_TILES_DIR] === 'string') {
        merged[CONFIG_KEY_TILES_DIR] = patch[CONFIG_KEY_TILES_DIR]
    }

    const patchCluster = patch[CONFIG_KEY_POI_CLUSTER]
    if (patchCluster && typeof patchCluster === 'object' && !Array.isArray(patchCluster)) {
        if (typeof patchCluster.chunkedLoading === 'boolean') {
            merged[CONFIG_KEY_POI_CLUSTER].chunkedLoading = patchCluster.chunkedLoading
        }
        if (typeof patchCluster.disableClusteringAtZoom === 'number' && Number.isFinite(patchCluster.disableClusteringAtZoom)) {
            merged[CONFIG_KEY_POI_CLUSTER].disableClusteringAtZoom = patchCluster.disableClusteringAtZoom
        }
        if (typeof patchCluster.showCoverageOnHover === 'boolean') {
            merged[CONFIG_KEY_POI_CLUSTER].showCoverageOnHover = patchCluster.showCoverageOnHover
        }
        if (typeof patchCluster.spiderfyOnMaxZoom === 'boolean') {
            merged[CONFIG_KEY_POI_CLUSTER].spiderfyOnMaxZoom = patchCluster.spiderfyOnMaxZoom
        }
    }

    return sanitizeConfig(merged)
}

/** Sends the updated config to every open renderer window via IPC. */
function broadcastConfigUpdated(config) {
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
            win.webContents.send('app-config-updated', config)
        }
    }
}

/**
 * Applies a partial patch to the persisted config, saves the result, and
 * broadcasts it to all open renderer windows.
 *
 * @param {object} patch Partial config values to apply.
 * @returns {object} The resulting full config.
 */
function updateConfig(patch) {
    const current = loadConfig()
    const updated = mergeConfigPatch(current, patch)
    saveConfig(updated)
    broadcastConfigUpdated(updated)
    return updated
}

/**
 * Returns the data directory path from the saved config if it exists on disk,
 * otherwise falls back to the default bundled data directory.
 */
function getDataDirectory() {
    const config = loadConfig()
    const dir = config[CONFIG_KEY_DATA_DIR]
    if (typeof dir === 'string' && fs.existsSync(dir)) {
        return dir
    }
    return getDefaultDataDirectory()
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
    ensureConfigFile,
    loadConfig,
    saveConfig,
    updateConfig,
    getDataDirectory,
}
