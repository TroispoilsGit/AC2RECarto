const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const SETTINGS_FILE = 'settings.json'
const SETTINGS_KEY_DATA_DIR = 'dataDirectory'

function getDefaultDataDirectory() {
    return path.join(app.getAppPath(), 'data')
}

function getSettingsPath() {
    return path.join(app.getPath('userData'), SETTINGS_FILE)
}

function loadSettings() {
    const settingsPath = getSettingsPath()
    try {
        if (!fs.existsSync(settingsPath)) {
            return {}
        }
        return JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    } catch {
        return {}
    }
}

function saveSettings(settings) {
    const settingsPath = getSettingsPath()
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8')
}

function getSavedDataDirectory() {
    const settings = loadSettings()
    const dir = settings[SETTINGS_KEY_DATA_DIR]
    if (typeof dir === 'string' && fs.existsSync(dir)) {
        return dir
    }
    return getDefaultDataDirectory()
}

function setSavedDataDirectory(dirPath) {
    const settings = loadSettings()
    settings[SETTINGS_KEY_DATA_DIR] = dirPath
    saveSettings(settings)
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