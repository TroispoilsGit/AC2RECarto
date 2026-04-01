const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const CONFIG_FILE = 'config.json'
const CONFIG_KEY_DATA_DIR = 'dataDirectory'
const CONFIG_KEY_POI_CLUSTER = 'poiCluster'
const CONFIG_KEY_TILES_DIR = 'tilesDirectory'

let mainWindow = null
let configWindow = null

function getDefaultDataDirectory() {
    return path.join(app.getAppPath(), 'data')
}

function getDefaultTilesDirectory() {
    if (app.isPackaged) {
        return path.join(path.dirname(process.execPath), 'tiles')
    }
    return path.join(app.getAppPath(), 'tiles')
}

function getConfigPath() {
    if (app.isPackaged) {
        return path.join(path.dirname(process.execPath), CONFIG_FILE)
    }
    return path.join(app.getAppPath(), 'out', CONFIG_FILE)
}

function getDefaultConfig() {
    return {
        [CONFIG_KEY_DATA_DIR]: getDefaultDataDirectory(),
        [CONFIG_KEY_TILES_DIR]: getDefaultTilesDirectory(),
        [CONFIG_KEY_POI_CLUSTER]: {
            chunkedLoading: true,
            disableClusteringAtZoom: 6,
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: false
        }
    }
}

function sanitizeConfig(rawConfig) {
    const defaults = getDefaultConfig()
    const sanitized = {
        [CONFIG_KEY_DATA_DIR]: defaults[CONFIG_KEY_DATA_DIR],
        [CONFIG_KEY_TILES_DIR]: defaults[CONFIG_KEY_TILES_DIR],
        [CONFIG_KEY_POI_CLUSTER]: {
            ...defaults[CONFIG_KEY_POI_CLUSTER]
        }
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

    const rawPoiCluster = rawConfig[CONFIG_KEY_POI_CLUSTER]
    if (rawPoiCluster && typeof rawPoiCluster === 'object' && !Array.isArray(rawPoiCluster)) {
        if (typeof rawPoiCluster.chunkedLoading === 'boolean') {
            sanitized[CONFIG_KEY_POI_CLUSTER].chunkedLoading = rawPoiCluster.chunkedLoading
        }
        if (typeof rawPoiCluster.disableClusteringAtZoom === 'number' && Number.isFinite(rawPoiCluster.disableClusteringAtZoom)) {
            sanitized[CONFIG_KEY_POI_CLUSTER].disableClusteringAtZoom = rawPoiCluster.disableClusteringAtZoom
        }
        if (typeof rawPoiCluster.showCoverageOnHover === 'boolean') {
            sanitized[CONFIG_KEY_POI_CLUSTER].showCoverageOnHover = rawPoiCluster.showCoverageOnHover
        }
        if (typeof rawPoiCluster.spiderfyOnMaxZoom === 'boolean') {
            sanitized[CONFIG_KEY_POI_CLUSTER].spiderfyOnMaxZoom = rawPoiCluster.spiderfyOnMaxZoom
        }
    }

    return sanitized
}

function ensureConfigFile() {
    const configPath = getConfigPath()
    const configDir = path.dirname(configPath)
    fs.mkdirSync(configDir, { recursive: true })

    const defaultConfig = getDefaultConfig()
    if (!fs.existsSync(configPath)) {
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8')
        return
    }

    try {
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        const sanitized = sanitizeConfig(parsed)
        if (JSON.stringify(parsed) !== JSON.stringify(sanitized)) {
            fs.writeFileSync(configPath, JSON.stringify(sanitized, null, 2), 'utf8')
        }
    } catch {
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8')
    }
}

function loadConfig() {
    const configPath = getConfigPath()
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

function saveConfig(config) {
    const configPath = getConfigPath()
    const sanitized = sanitizeConfig(config)
    fs.writeFileSync(configPath, JSON.stringify(sanitized, null, 2), 'utf8')
}

function mergeConfigPatch(currentConfig, patch) {
    const merged = {
        ...currentConfig,
        [CONFIG_KEY_POI_CLUSTER]: {
            ...currentConfig[CONFIG_KEY_POI_CLUSTER]
        }
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

    const patchPoiCluster = patch[CONFIG_KEY_POI_CLUSTER]
    if (patchPoiCluster && typeof patchPoiCluster === 'object' && !Array.isArray(patchPoiCluster)) {
        if (typeof patchPoiCluster.chunkedLoading === 'boolean') {
            merged[CONFIG_KEY_POI_CLUSTER].chunkedLoading = patchPoiCluster.chunkedLoading
        }
        if (typeof patchPoiCluster.disableClusteringAtZoom === 'number' && Number.isFinite(patchPoiCluster.disableClusteringAtZoom)) {
            merged[CONFIG_KEY_POI_CLUSTER].disableClusteringAtZoom = patchPoiCluster.disableClusteringAtZoom
        }
        if (typeof patchPoiCluster.showCoverageOnHover === 'boolean') {
            merged[CONFIG_KEY_POI_CLUSTER].showCoverageOnHover = patchPoiCluster.showCoverageOnHover
        }
        if (typeof patchPoiCluster.spiderfyOnMaxZoom === 'boolean') {
            merged[CONFIG_KEY_POI_CLUSTER].spiderfyOnMaxZoom = patchPoiCluster.spiderfyOnMaxZoom
        }
    }

    return sanitizeConfig(merged)
}

function broadcastConfigUpdated(updatedConfig) {
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
            win.webContents.send('app-config-updated', updatedConfig)
        }
    }
}

function updateConfig(patch) {
    const currentConfig = loadConfig()
    const nextConfig = mergeConfigPatch(currentConfig, patch)
    saveConfig(nextConfig)
    broadcastConfigUpdated(nextConfig)
    return nextConfig
}

function getSavedDataDirectory() {
    const config = loadConfig()
    const dir = config[CONFIG_KEY_DATA_DIR]
    if (typeof dir === 'string' && fs.existsSync(dir)) {
        return dir
    }
    return getDefaultDataDirectory()
}

async function openDirectoryDialog(options = {}) {
    const selected = await dialog.showOpenDialog(mainWindow, {
        title: typeof options.title === 'string' && options.title.trim() !== '' ? options.title : 'Select directory',
        defaultPath: typeof options.defaultPath === 'string' && options.defaultPath.trim() !== '' ? options.defaultPath : undefined,
        properties: ['openDirectory']
    })

    if (selected.canceled || selected.filePaths.length === 0) {
        return null
    }

    return selected.filePaths[0]
}

function openConfigWindow() {
    if (configWindow && !configWindow.isDestroyed()) {
        configWindow.focus()
        return
    }

    configWindow = new BrowserWindow({
        width: 520,
        height: 500,
        resizable: false,
        parent: mainWindow,
        modal: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    })

    configWindow.on('closed', () => {
        configWindow = null
    })

    configWindow.loadFile('config.html')
}

function buildApplicationMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Config',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => openConfigWindow()
                },
                { type: 'separator' },
                { role: 'quit', label: 'Exit' }
            ]
        }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })

    mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
    ensureConfigFile()

    ipcMain.handle('get-app-config', () => loadConfig())
    ipcMain.handle('update-app-config', (_event, patch) => updateConfig(patch))
    ipcMain.handle('open-directory-dialog', (_event, options) => openDirectoryDialog(options))
    ipcMain.handle('get-data-directory', () => getSavedDataDirectory())

    buildApplicationMenu()
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})