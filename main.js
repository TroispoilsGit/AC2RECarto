// main.js
// Electron main process entry point.
// Registers IPC handlers and wires together the config store and window manager.

const { app, ipcMain } = require('electron')
const { ensureConfigFile, loadConfig, updateConfig, getDataDirectory } = require('./electron/configStore')
const { createMainWindow, openDirectoryDialog, buildApplicationMenu } = require('./electron/windowManager')

app.whenReady().then(() => {
    // Ensure config.json exists and is valid before any renderer window loads.
    ensureConfigFile()

    // ── IPC Handlers ──────────────────────────────────────────────────────────
    // These channels are the only communication bridge between the renderer
    // processes and the main process file-system / config logic.

    ipcMain.handle('get-app-config', () => loadConfig())
    ipcMain.handle('update-app-config', (_event, patch) => updateConfig(patch))
    ipcMain.handle('open-directory-dialog', (_event, options) => openDirectoryDialog(options))
    ipcMain.handle('get-data-directory', () => getDataDirectory())

    // ── Bootstrap ─────────────────────────────────────────────────────────────
    buildApplicationMenu()
    createMainWindow()
})

app.on('window-all-closed', () => {
    // On macOS it is conventional to keep the app running until the user
    // explicitly quits via Cmd+Q.
    if (process.platform !== 'darwin') app.quit()
})