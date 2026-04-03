// scripts/app.js
// Renderer bootstrap: initialises the Leaflet map and attaches all overlay
// controls. This is the entry point for the map window (index.html).

import { initMap, map } from './map.js'
import { initPoiOverlay } from './overlays/poiOverlay.js'
import { initCoordOverlay, updateCoordDisplay } from './overlays/coordOverlay.js'
import { setAppConfig } from './modules/appConfig.js'

const { ipcRenderer } = require('electron')

/**
 * Bootstraps the application: creates the map then registers all overlays
 * and event listeners.
 */
async function bootstrap() {
    await initMap()

    initPoiOverlay(map)
    initCoordOverlay(map)

    // Update the coordinate display whenever the user clicks on the map.
    map.on('click', (ev) => updateCoordDisplay(ev, map))
}

bootstrap().catch((error) => {
    console.error('Failed to initialise the map:', error)
})

// When the main process broadcasts a config change, update the cached config
// and reload the window so that directory and clustering changes take effect.
ipcRenderer.on('app-config-updated', (_event, config) => {
    setAppConfig(config)
    window.location.reload()
})
