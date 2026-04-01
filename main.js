const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const CONFIG_FILE = 'config.json'
const CONFIG_KEY_DATA_DIR = 'dataDirectory'
const CONFIG_KEY_POI_CLUSTER = 'poiCluster'
const CONFIG_KEY_TILES_DIR = 'tilesDirectory'

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
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8')
}

function getSavedDataDirectory() {
    const config = loadConfig()
    const dir = config[CONFIG_KEY_DATA_DIR]
    if (typeof dir === 'string' && fs.existsSync(dir)) {
        return dir
    }
    return getDefaultDataDirectory()
}

function setSavedDataDirectory(dirPath) {
    const config = loadConfig()
    config[CONFIG_KEY_DATA_DIR] = dirPath
    saveConfig(config)
}

async function chooseDataDirectory(parentWindow) {
    const selected = await dialog.showOpenDialog(parentWindow, {
        title: 'Select POI data directory',
        defaultPath: getSavedDataDirectory(),
        properties: ['openDirectory']
    })

    if (selected.canceled || selected.filePaths.length === 0) {
        return null
    }

    const dirPath = selected.filePaths[0]
    setSavedDataDirectory(dirPath)
    return dirPath
}

function buildApplicationMenu() {
    const template = [
        {
            label: 'Data',
            submenu: [
                {
                    label: 'Select POI data directory...',
                    accelerator: 'CmdOrCtrl+Shift+O',
                    click: async (_, browserWindow) => {
                        const targetWindow = browserWindow || BrowserWindow.getFocusedWindow()
                        const selectedPath = await chooseDataDirectory(targetWindow)
                        if (selectedPath && targetWindow && !targetWindow.isDestroyed()) {
                            targetWindow.webContents.send('data-directory-updated', selectedPath)
                        }
                    }
                }
            ]
        }
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })

    win.loadFile('index.html')
}

app.whenReady().then(() => {
    ensureConfigFile()

    ipcMain.handle('get-app-config', () => loadConfig())
    ipcMain.handle('get-data-directory', () => getSavedDataDirectory())
    ipcMain.handle('choose-data-directory', async (event) => {
        const window = BrowserWindow.fromWebContents(event.sender)
        return chooseDataDirectory(window)
    })

    buildApplicationMenu()
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})