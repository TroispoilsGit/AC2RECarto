import InitMap, { map } from "./map.js";
import InitOverlayPoi from "./overlays/overlaysPoi.js";
import InitOverlayCoord, { UpdateCoord } from "./overlays/overlaysCoord.js";
import { ensureDataDirectory, chooseDataDirectory, setDataDirectory } from "./modules/dataDirectory.js";

const { ipcRenderer } = require("electron");

const selectDataFolderButton = document.getElementById("selectDataFolderButton");

function updateDataFolderLabel(folderPath) {
    if (selectDataFolderButton) {
        selectDataFolderButton.title = `Dossier data: ${folderPath}`;
    }
}

//Init leaflet
InitMap();

//Init Overlay Control
InitOverlayPoi(map);
InitOverlayCoord(map);

map.on("click", function (ev) {
    UpdateCoord(ev, map);
});

ensureDataDirectory().then(updateDataFolderLabel).catch((error) => {
    console.error("Unable to load data directory:", error);
    if (selectDataFolderButton) {
        selectDataFolderButton.title = "Dossier data: erreur de chargement";
    }
});

if (selectDataFolderButton) {
    selectDataFolderButton.addEventListener("click", async () => {
        const selectedPath = await chooseDataDirectory();
        if (selectedPath) {
            updateDataFolderLabel(selectedPath);
            window.location.reload();
        }
    });
}

ipcRenderer.on("data-directory-updated", (_event, selectedPath) => {
    setDataDirectory(selectedPath);
    updateDataFolderLabel(selectedPath);
    window.location.reload();
});
