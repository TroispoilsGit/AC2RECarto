import initPoImarker, { listPoiJsonFiles } from '../modules/poi.js';
import customIcons from '../modules/iconsMap.js';
import npcLocOverlay from "./overlaysNpc.js";

var baseLayerControl = null;
var extraLayerControl = null;

const fallbackIcon = customIcons.greySquareIcon;
const additionalPoiIcon = customIcons.redCrossAdditionalFullIcon || fallbackIcon;

const iconByFileName = {
    ringways: customIcons.blueCircleVoidIcon,
    gateways: customIcons.blueCircleFullIcon,
    poi: customIcons.blueCrossFullIcon,
    town: customIcons.yellowSquareFullIcon,
    outpost: customIcons.yellowSquareVoidIcon,
    vault: customIcons.redCrossFullIcon,
    dungeon: customIcons.redCrossVoidIcon,
    city: customIcons.yellowCrownIcon,
    faction: customIcons.greySquareIcon,
};

const basePoiOrder = [
    'ringways',
    'gateways',
    'poi',
    'town',
    'outpost',
    'vault',
    'dungeon',
    'city',
    'faction',
];

const labelByFileName = {
    ringways: 'Ringways',
    gateways: 'Gateways',
    poi: 'PoI',
    town: 'Town',
    outpost: 'Outpost',
    vault: 'Vault',
    dungeon: 'Dungeon',
    city: 'City',
    faction: 'Faction',
};

function toLayerLabel(fileNameWithoutExt) {
    const lowerName = fileNameWithoutExt.toLowerCase();
    if (labelByFileName[lowerName]) {
        return labelByFileName[lowerName];
    }

    if (!fileNameWithoutExt) {
        return 'Unknown';
    }

    return fileNameWithoutExt.charAt(0).toUpperCase() + fileNameWithoutExt.slice(1);
}

function escapeHtml(text) {
    return String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function getOverlayDisplayLabel(label, iconUrl) {
    const safeLabel = escapeHtml(label);

    if (!iconUrl) {
        return safeLabel;
    }

    const safeIconUrl = escapeHtml(iconUrl);
    return `<span class="poi-overlay-entry"><span class="poi-overlay-name">${safeLabel}</span><span class="poi-overlay-separator"> - </span><img class="poi-overlay-icon" src="${safeIconUrl}" alt=""></span>`;
}

function applyPoiControlClass(control) {
    if (!control) {
        return;
    }

    control.getContainer().classList.add('poi-overlay-control');
}

async function getOverlayMaps() {
    const jsonFiles = await listPoiJsonFiles();

    const layersEntries = await Promise.all(jsonFiles.map(async (fileName) => {
        const name = fileName.replace(/\.json$/i, '');
        const lowerName = name.toLowerCase();
        const label = toLayerLabel(name);
        const isBase = Object.prototype.hasOwnProperty.call(iconByFileName, lowerName);
        const icon = isBase ? iconByFileName[lowerName] : additionalPoiIcon;

        try {
            const data = await initPoImarker(name);
            if (!Array.isArray(data)) {
                console.warn(`Skipping ${fileName}: expected an array of POI entries.`);
                return null;
            }

            const markers = data.map((item) => {
                const description = item.description || name;
                return L.marker([item.y, item.x], { icon }).bindPopup(description);
            });

            let layer;
            if (isBase) {
                layer = L.layerGroup(markers);
            } else {
                layer = L.markerClusterGroup({
                    chunkedLoading: true,
                    disableClusteringAtZoom: 6,
                    showCoverageOnHover: false,
                    spiderfyOnMaxZoom: false,
                });
                layer.addLayers(markers);
            }

            return {
                label,
                layer,
                isBase,
                lowerName,
                iconUrl: icon.options?.iconUrl || null,
            };
        } catch (error) {
            console.error(`Error fetching ${fileName} data:`, error);
            return null;
        }
    }));

    const validEntries = layersEntries.filter((entry) => entry !== null);
    const baseEntries = validEntries.filter((entry) => entry.isBase);
    const extraEntries = validEntries.filter((entry) => !entry.isBase);

    baseEntries.sort((a, b) => {
        return basePoiOrder.indexOf(a.lowerName) - basePoiOrder.indexOf(b.lowerName);
    });

    extraEntries.sort((a, b) => a.label.localeCompare(b.label));

    const baseOverlays = {};
    baseEntries.forEach((entry) => {
        const displayLabel = getOverlayDisplayLabel(entry.label, entry.iconUrl);
        baseOverlays[displayLabel] = entry.layer;
    });

    const extraOverlays = {};
    extraEntries.forEach((entry) => {
        const displayLabel = getOverlayDisplayLabel(entry.label, entry.iconUrl);
        extraOverlays[displayLabel] = entry.layer;
    });

    return {
        baseOverlays,
      extraOverlays,
    };
}

function addControlTitle(control, titleText) {
    const list = control.getContainer().querySelector('.leaflet-control-layers-list');
    const title = document.createElement('div');
    title.className = 'leaflet-control-layers-section-title';
    title.textContent = titleText;
    list.prepend(title);
}

export default function InitialisationOverlay(map) {
    getOverlayMaps().then(({ baseOverlays, extraOverlays }) => {
        if (baseLayerControl) {
            map.removeControl(baseLayerControl);
        }
        if (extraLayerControl) {
            map.removeControl(extraLayerControl);
        }

        baseLayerControl = L.control.layers(null, baseOverlays, { collapsed: false }).addTo(map);
        addControlTitle(baseLayerControl, 'Base POIs');
        applyPoiControlClass(baseLayerControl);

        if (Object.keys(extraOverlays).length > 0) {
            extraLayerControl = L.control.layers(null, extraOverlays, { collapsed: false }).addTo(map);
            addControlTitle(extraLayerControl, 'Additional POIs');
            applyPoiControlClass(extraLayerControl);
        } else {
            extraLayerControl = null;
        }
    });
}