// electron/windowManager.js
// Manages the application windows (main map window and config window) along
// with the native application menu and the directory-picker dialog helper.

const { BrowserWindow, dialog, Menu } = require('electron')

// Module-level window references so that we can prevent duplicate windows
// and use the main window as a parent for dialogs and modal windows.
let mainWindow = null
let configWindow = null

// ─── Main Window ─────────────────────────────────────────────────────────────

/** Creates the primary map window and loads index.html. */
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        },
    })

    mainWindow.loadFile('index.html')
}

// ─── Config Window ────────────────────────────────────────────────────────────

/**
 * Opens the configuration window. If the window is already open it is brought
 * to the foreground instead of creating a duplicate.
 */
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
            enableRemoteModule: true,
        },
    })

    configWindow.on('closed', () => {
        configWindow = null
    })

    configWindow.loadFile('config.html')
}

// ─── Directory Dialog ─────────────────────────────────────────────────────────

/**
 * Shows the OS folder-picker dialog and returns the selected path.
 * Returns `null` if the user cancelled the dialog.
 *
 * @param {{ title?: string, defaultPath?: string }} options
 * @returns {Promise<string|null>}
 */
async function openDirectoryDialog(options = {}) {
    const title =
        typeof options.title === 'string' && options.title.trim() !== ''
            ? options.title
            : 'Select directory'

    const defaultPath =
        typeof options.defaultPath === 'string' && options.defaultPath.trim() !== ''
            ? options.defaultPath
            : undefined

    const result = await dialog.showOpenDialog(mainWindow, {
        title,
        defaultPath,
        properties: ['openDirectory'],
    })

    if (result.canceled || result.filePaths.length === 0) {
        return null
    }

    return result.filePaths[0]
}

// ─── Application Menu ─────────────────────────────────────────────────────────

/** Builds and registers the native application menu. */
function buildApplicationMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Config',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => openConfigWindow(),
                },
                { type: 'separator' },
                { role: 'quit', label: 'Exit' },
            ],
        },
    ]

    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
    createMainWindow,
    openConfigWindow,
    openDirectoryDialog,
    buildApplicationMenu,
}
