const { ipcRenderer } = require('electron');

let currentDataDirectory = null;
let currentAppConfig = null;

export async function getAppConfig() {
    if (!currentAppConfig) {
        currentAppConfig = await ipcRenderer.invoke('get-app-config');
    }
    return currentAppConfig;
}

export async function ensureDataDirectory() {
    if (!currentDataDirectory) {
        currentDataDirectory = await ipcRenderer.invoke('get-data-directory');
    }
    return currentDataDirectory;
}

export async function chooseDataDirectory() {
    const selectedPath = await ipcRenderer.invoke('choose-data-directory');
    if (selectedPath) {
        currentDataDirectory = selectedPath;
    }
    return selectedPath;
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
