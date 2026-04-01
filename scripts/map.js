// Constantes
import { getAppConfig } from "./modules/dataDirectory.js";

const { pathToFileURL } = require("node:url");

const TILE_SIZE = 255;
const CENTER_LAT = -127.5;
const CENTER_LON = 127.5;
const ZOOM_LEVEL = 4;
const BOUNDS_MAX = [
  [-255, 0],
  [0, 255],
];

// Variables
export var map = {};

// Fonction pour initialiser la carte
export default async function InitialisationMap() {
  const appConfig = await getAppConfig();

  map = L.map("map", {
    crs: L.CRS.Simple,
    minZoom: 1,
    maxZoom: 8,
  }).setView([CENTER_LAT, CENTER_LON], ZOOM_LEVEL);

  addTileLayer(appConfig?.tilesDirectory);
}

// Fonction pour ajouter la couche de tuiles
function addTileLayer(tilesDirectory) {
  const tilesUrl = getTilesUrl(tilesDirectory);

  L.tileLayer(tilesUrl, {
    tileSize: TILE_SIZE,
    noWrap: true,
    bounds: BOUNDS_MAX,
    attribution: "© Asheron's call 2 maps",
  }).addTo(map);
}

function getTilesUrl(tilesDirectory) {
  if (!tilesDirectory || typeof tilesDirectory !== "string") {
    return "tiles/{z}/{x}/{y}.png";
  }

  const baseUrl = pathToFileURL(tilesDirectory).href.replace(/\/$/, "");
  return `${baseUrl}/{z}/{x}/{y}.png`;
}