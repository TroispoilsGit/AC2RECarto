const { ipcRenderer } = require('electron');

let currentDataDirectory = null;
let currentAppConfig = null;

export async function getAppConfig() {
    if (!currentAppConfig) {
        currentAppConfig = await ipcRenderer.invoke('get-app-config');
        if (currentAppConfig && typeof currentAppConfig.dataDirectory === 'string' && currentAppConfig.dataDirectory.trim() !== '') {
            currentDataDirectory = currentAppConfig.dataDirectory;
        }
    }
    return currentAppConfig;
}

export async function ensureDataDirectory() {
    if (!currentDataDirectory) {
        const config = await getAppConfig();
        currentDataDirectory = config.dataDirectory;
    }
    return currentDataDirectory;
}

export function setAppConfig(config) {
    if (config && typeof config === 'object') {
        currentAppConfig = config;
        if (typeof config.dataDirectory === 'string' && config.dataDirectory.trim() !== '') {
            currentDataDirectory = config.dataDirectory;
        }
    }
}

export function setDataDirectory(dirPath) {
    if (dirPath) {
        currentDataDirectory = dirPath;
        if (currentAppConfig && typeof currentAppConfig === 'object') {
            currentAppConfig.dataDirectory = dirPath;
        }
    }
}

export function getCachedDataDirectory() {
    return currentDataDirectory;
}
