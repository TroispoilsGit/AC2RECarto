# Cartographer of Asheron's Call 2

![Cartographer Demo](demo.gif)

An interactive 2D map viewer for **Asheron's Call 2**, built with [Electron](https://www.electronjs.org/) and [Leaflet](https://leafletjs.com/). Browse the game world, toggle Points of Interest by category, and click anywhere to display in-game coordinates and LandBlock IDs.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Retrieve the Tiles Folder](#2-retrieve-the-tiles-folder)
  - [3. Install Dependencies](#3-install-dependencies)
  - [4. Run the Application](#4-run-the-application)
- [Configuration](#configuration)
  - [Config File Location](#config-file-location)
  - [Default Configuration](#default-configuration)
  - [Configuration Options](#configuration-options)
  - [Configuration Window](#configuration-window)
- [POI Data Format](#poi-data-format)
  - [Base Categories](#base-categories)
  - [Additional POIs](#additional-pois)
- [Project Structure](#project-structure)
- [Building & Packaging](#building--packaging)
  - [Package with Electron Forge](#package-with-electron-forge)
  - [Build with Docker](#build-with-docker)
  - [Code Signing (Windows)](#code-signing-windows)
- [Tests](#tests)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Features

- **Interactive Leaflet Map** — Pan, zoom (levels 1–8), and explore the full Asheron's Call 2 world through a tiled map.
- **Point of Interest Overlays** — Toggle 9 built-in POI categories (Ringways, Gateways, Towns, Cities, Outposts, Vaults, Dungeons, Factions, generic PoI), each with a dedicated icon.
- **Custom POI Support** — Drop any additional `.json` file into the data folder; it is automatically discovered, loaded, and displayed with marker clustering.
- **Coordinate Display** — Click anywhere on the map to see the cardinal coordinates (e.g. `42.5N 18.3E`) and the LandBlock ID (`0x2A12FFFF`).
- **Configuration Window** — Edit data directory, tiles directory, and clustering options from a built-in settings panel (`Ctrl+,` or *File → Config*).
- **Auto-Setup** — A `config.json` is created and validated automatically on first launch; invalid or missing keys are restored to defaults.
- **External Tiles** — Map tiles are loaded from a configurable directory, keeping the app package lightweight.
- **Persistent Settings** — All configuration changes are saved to disk and restored on restart.

---

## Prerequisites

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org/) | **20** or later |
| [npm](https://www.npmjs.com/) | Bundled with Node.js |
| [Git](https://git-scm.com/) | Any recent version |

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/TroispoilsGit/Ac2reCarto.git
cd Ac2reCarto
```

### 2. Retrieve the Tiles Folder

> **⚠️ Important:** The `tiles/` folder contains all the map tile images required by the application. Due to its size, make sure it is present in the project root after cloning.
>
> If you downloaded a release archive or a shallow clone that does not include the tiles, you **must** copy the `tiles/` folder from the full repository into the project root before running the app. Without it, the map will not display any imagery.

The expected structure is:

```
AC2RECarto/
├── tiles/
│   ├── 1/
│   ├── 2/
│   ├── ...
│   └── 8/
├── data/
├── scripts/
└── ...
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm start
```

The Electron window will open with the interactive map. Use **File → Config** (or `Ctrl+,`) to customize paths and clustering options.

---

## Configuration

### Config File Location

| Mode | Path |
|------|------|
| Development | `out/config.json` (created automatically) |
| Packaged (EXE) | Next to the executable, e.g. `.../cartographe-ac2re.exe` → `.../config.json` |

### Default Configuration

```json
{
  "dataDirectory": "<app-root>/data",
  "tilesDirectory": "<app-root>/tiles",
  "poiCluster": {
    "chunkedLoading": true,
    "disableClusteringAtZoom": 6,
    "showCoverageOnHover": false,
    "spiderfyOnMaxZoom": false
  }
}
```

### Configuration Options

| Key | Type | Description |
|-----|------|-------------|
| `dataDirectory` | `string` | Path to the folder containing POI `.json` files. |
| `tilesDirectory` | `string` | Path to the folder containing map tile images (`{z}/{x}/{y}.png`). |
| `poiCluster.chunkedLoading` | `boolean` | Load clustered markers in chunks to avoid UI freezing. |
| `poiCluster.disableClusteringAtZoom` | `number` | Zoom level at which clustering is disabled and individual markers are shown. |
| `poiCluster.showCoverageOnHover` | `boolean` | Show the bounds of a cluster on hover. |
| `poiCluster.spiderfyOnMaxZoom` | `boolean` | Spiderfy overlapping markers at maximum zoom. |

### Configuration Window

Open via **File → Config** or `Ctrl+,`. The window lets you:

- Browse and select the **data directory** and **tiles directory**.
- Adjust **POI clustering** options.
- **Reset to defaults** with a single click.

All changes are auto-saved and applied immediately.

---

## POI Data Format

Each POI file is a JSON array of objects:

```json
[
  {
    "x": 120.5,
    "y": -42.0,
    "description": "Optional popup text"
  }
]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `x` | `number` | Yes | X coordinate on the map. |
| `y` | `number` | Yes | Y coordinate on the map. |
| `description` | `string` | No | Text displayed in the marker popup. Defaults to the file name. |

### Base Categories

These file names are recognized automatically with dedicated icons and appear under the **Base POIs** overlay panel:

| File | Category | Icon |
|------|----------|------|
| `ringways.json` | Ringways | Blue circle (void) |
| `gateways.json` | Gateways | Blue circle (full) |
| `poi.json` | PoI | Blue cross |
| `town.json` | Town | Yellow square (full) |
| `outpost.json` | Outpost | Yellow square (void) |
| `vault.json` | Vault | Red cross (full) |
| `dungeon.json` | Dungeon | Red cross (void) |
| `city.json` | City | Yellow crown |
| `faction.json` | Faction | Grey square |

### Additional POIs

Any other `.json` file placed in the data directory is listed under **Additional POIs**. These markers use **clustering** (configurable via `poiCluster` settings) to keep the map performant when many points are present.

---

## Project Structure

```
AC2RECarto/
├── main.js                          # Electron entry point — IPC handlers & app lifecycle only
├── index.html                       # Main renderer page (map)
├── config.html                      # Configuration window
├── package.json
├── forge.config.js                  # Electron Forge packaging config
├── Dockerfile                       # Reproducible build environment
│
├── electron/                        # Main-process modules (Node.js / Electron only)
│   ├── configStore.js               # Config file I/O, defaults, sanitization & broadcast
│   └── windowManager.js             # Window creation, app menu & directory-picker dialog
│
├── data/                            # Default POI JSON files
│   ├── city.json
│   ├── dungeon.json
│   ├── faction.json
│   ├── gateways.json
│   ├── outpost.json
│   ├── poi.json
│   ├── ringways.json
│   ├── town.json
│   └── vault.json
│
├── icons/                           # Marker icon images (PNG)
│
├── scripts/                         # Renderer-process scripts
│   ├── app.js                       # Renderer entry point — bootstrap map & overlays
│   ├── map.js                       # Leaflet map creation & tile layer
│   ├── configWindow.js              # Config window renderer logic
│   ├── modules/
│   │   ├── appConfig.js             # In-memory config cache, IPC fetch & update helpers
│   │   ├── icons.js                 # Custom Leaflet icon definitions
│   │   ├── coordinates.js           # Cardinal coordinate & LandBlock ID calculations
│   │   └── dataLoader.js            # POI JSON file loading & directory listing
│   └── overlays/
│       ├── coordOverlay.js          # Coordinate display overlay (click → coords)
│       ├── npcOverlay.js            # NPC markers overlay (server integration, WIP)
│       ├── playerOverlay.js         # Player markers overlay (server integration, WIP)
│       └── poiOverlay.js            # POI layer controls (base + additional categories)
│
├── style/
│   └── style.css                    # Map and overlay styles
│
├── tests/
│   └── json-files.test.js           # Validates POI JSON file structure
│
└── tiles/                           # Map tile images (z/x/y.png) — see "Retrieve the Tiles Folder"
    ├── 1/
    ├── 2/
    ├── ...
    └── 8/
```

---

## Building & Packaging

### Package with Electron Forge

```bash
# Package (unpacked output in out/)
npm run package

# Create distributable installer
npm run make
```

> **Note:** The `tiles/` folder is **excluded** from the Electron Forge package to reduce build size. For packaged builds, place the `tiles/` folder next to the generated executable.

### Build with Docker

A Dockerfile is provided for reproducible builds:

```bash
# Build the image
docker build -t ac2re-carto-build .

# Run and export artifacts to out/
docker run --rm -v "${PWD}/out:/app/out" ac2re-carto-build
```

On Windows Command Prompt (no `${PWD}` support), use an absolute path:

```cmd
docker run --rm -v "C:\path\to\AC2RECarto\out:/app/out" ac2re-carto-build
```

### Code Signing (Windows)

If Windows blocks the EXE with **Smart App Control**, the application is likely unsigned. Electron Forge signs automatically when these environment variables are set:

| Variable | Description |
|----------|-------------|
| `WIN_CSC_LINK` / `WINDOWS_CERTIFICATE_FILE` | Path to your `.pfx` certificate |
| `WIN_CSC_KEY_PASSWORD` / `WINDOWS_CERTIFICATE_PASSWORD` | Certificate password |
| `WINDOWS_TIMESTAMP_SERVER` *(optional)* | Timestamp server URL (defaults to `http://timestamp.digicert.com`) |

Example:

```powershell
$env:WIN_CSC_LINK = "C:\certs\my-cert.pfx"
$env:WIN_CSC_KEY_PASSWORD = "your-password"
npm run make
```

> SmartScreen reputation may still take time to build for newly signed apps. EV code-signing certificates build trust faster.

---

## Tests

Run the test suite to validate POI data files:

```bash
npm test
```

Tests verify that:
- The `data/` directory exists.
- All `.json` files contain valid JSON arrays.
- Each POI entry has finite `x` and `y` coordinates.

---

## Contributing

Contributions are welcome! To get started:

1. Fork the repository and create your branch from `main`.
2. Make your changes following the existing code style.
3. Run `npm test` to validate POI data integrity.
4. Open a pull request with a clear description of your changes.

---

## License

This project is licensed under the [ISC License](https://www.isc.org/licenses/).

---

## Acknowledgments

- [Electron](https://www.electronjs.org/) and [Leaflet](https://leafletjs.com/) communities for their outstanding tools and documentation.
- The vibrant Asheron's Call 2 community for keeping Dereth alive.
