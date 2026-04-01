import InitMap, { map } from "./map.js";
import InitOverlayPoi from "./overlays/overlaysPoi.js";
import InitOverlayCoord, { UpdateCoord } from "./overlays/overlaysCoord.js";
import { setAppConfig } from "./modules/dataDirectory.js";

const { ipcRenderer } = require("electron");

async function bootstrap() {
    //Init leaflet
    await InitMap();

    //Init Overlay Control
    InitOverlayPoi(map);
    InitOverlayCoord(map);

    map.on("click", function (ev) {
        UpdateCoord(ev, map);
    });
}

bootstrap().catch((error) => {
    console.error("Unable to initialize map:", error);
});

ipcRenderer.on("app-config-updated", (_event, config) => {
    setAppConfig(config);
    window.location.reload();
});
