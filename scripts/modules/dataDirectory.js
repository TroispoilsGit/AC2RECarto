const { ipcRenderer } = require('electron');

let currentDataDirectory = null;

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
    }
}

export function getCachedDataDirectory() {
    return currentDataDirectory;
}
