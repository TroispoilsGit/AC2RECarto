// scripts/modules/appConfig.js
// Caches the application configuration received from the main process so that
// renderer modules can access it synchronously after the first async fetch.

const { ipcRenderer } = require('electron')

/** In-memory cache of the full application config object. */
let cachedConfig = null

/** Convenience reference to the data directory extracted from the config. */
let cachedDataDirectory = null

// ─── Getters ──────────────────────────────────────────────────────────────────

/**
 * Returns the full application config.
 * Fetches it from the main process on the first call; subsequent calls return
 * the in-memory cached value.
 *
 * @returns {Promise<object>}
 */
export async function getAppConfig() {
    if (!cachedConfig) {
        cachedConfig = await ipcRenderer.invoke('get-app-config')
        if (typeof cachedConfig?.dataDirectory === 'string' && cachedConfig.dataDirectory.trim() !== '') {
            cachedDataDirectory = cachedConfig.dataDirectory
        }
    }
    return cachedConfig
}

/**
 * Returns the data directory path from the config.
 * Fetches the config on the first call; subsequent calls use the cache.
 *
 * @returns {Promise<string>}
 */
export async function getDataDirectory() {
    if (!cachedDataDirectory) {
        const config = await getAppConfig()
        cachedDataDirectory = config.dataDirectory
    }
    return cachedDataDirectory
}

// ─── Setters ──────────────────────────────────────────────────────────────────

/**
 * Updates the in-memory config cache.
 * Called when the main process broadcasts a config change so that subsequent
 * reads reflect the latest values without triggering another IPC round-trip.
 *
 * @param {object} config
 */
export function setAppConfig(config) {
    if (config && typeof config === 'object') {
        cachedConfig = config
        if (typeof config.dataDirectory === 'string' && config.dataDirectory.trim() !== '') {
            cachedDataDirectory = config.dataDirectory
        }
    }
}
