# Cartographer of Asheron's Call 2

![Cartographer Demo](demo.gif)

Cartographer of Asheron's Call 2 is a simple, lively 2D map tool built using ElectronJS and the Leaflet library. It aims to provide players of Asheron's Call 2 with an intuitive way to explore the game world and plan their adventures.

## Features

- **Interactive Map**: Explore the vast world of Asheron's Call 2 through an interactive 2D map interface.
- **POI Data Directory Picker**: Select the folder containing your POI `.json` files directly from the app (button or menu).
- **Persistent Data Folder**: The selected POI folder is saved and restored automatically when the app restarts.
- **Config File Auto-Setup**: A `config.json` file is created and validated automatically at startup.
- **External Tiles Directory**: Tiles are loaded from a configurable external folder (`tilesDirectory`) instead of being bundled in the app package.
- **Automatic JSON Discovery**: All `.json` files found in the selected data folder are loaded automatically.
- **Base vs Additional POIs**: Built-in categories (Ringways, Gateways, PoI, Town, Outpost, Vault, Dungeon, City, Faction) are shown separately from extra JSON files.
- **Additional POI Clustering**: Extra POIs are clustered with marker counts to keep the map smooth when many points are present.
- **Zoom and Pan**: Zoom in and out, pan across the map to focus on specific regions.
- **Responsive Design**: Works seamlessly on desktop and mobile devices for convenience.
- **Simple and Lightweight**: Built with simplicity and performance in mind, ensuring a smooth user experience.

## POI Data Format

Each POI file must be a JSON array of objects containing coordinates:

```json
[
   {
      "x": 120.5,
      "y": -42.0,
      "description": "Optional popup text"
   }
]
```

- `x`: X coordinate (required)
- `y`: Y coordinate (required)
- `description`: Popup text (optional)

### Base category file names

These file names receive dedicated icons and appear under the **Base POIs** section:

- `ringways.json`
- `gateways.json`
- `poi.json`
- `town.json`
- `outpost.json`
- `vault.json`
- `dungeon.json`
- `city.json`
- `faction.json`

Any other `.json` file is listed under **Additional POIs** and uses clustering.

## Configuration File

The app automatically creates and validates a `config.json` file at startup.

- Development mode location: `out/config.json`
- Packaged EXE location: next to the executable (`.../cartographe-ac2re.exe` and `.../config.json`)

Default template:

```json
{
   "dataDirectory": "<project-or-exe>/data",
   "tilesDirectory": "<project-or-exe>/tiles",
   "poiCluster": {
      "chunkedLoading": true,
      "disableClusteringAtZoom": 6,
      "showCoverageOnHover": false,
      "spiderfyOnMaxZoom": false
   }
}
```

Notes:

- If `config.json` is missing, it is created automatically.
- If it contains invalid or missing keys, defaults are restored for those keys.
- `poiCluster` options are used for additional POI marker clustering.

## Packaging and Tiles

To speed up builds and reduce package size, the `tiles/` folder is excluded from Electron Forge packaging.

This means:

- You must provide a `tiles` folder externally.
- By default, the app reads tiles from `tilesDirectory` in `config.json`.
- For packaged builds, placing `tiles/` next to the EXE matches the default config.

## Installation

To run Cartographer of Asheron's Call 2 locally, follow these steps:

1. Clone this repository to your local machine.
   ```bash
   git clone https://github.com/TroispoilsGit/Ac2reCarto.git
   ```

2. Navigate to the project directory.
   ```bash
   cd Ac2reCarto
   ```

3. Install dependencies using npm or yarn.
   ```bash
   npm install
   # or
   yarn install
   ```

4. Start the application.
   ```bash
   npm start
   # or
   yarn start
   ```

## Build with Docker

You can package the application inside Docker to automate compilation in a reproducible environment.

1. Build the Docker image:
   ```bash
   docker build -t ac2re-carto-build .
   ```

2. Run the container and export build artifacts to your local `out/` folder:
   ```bash
   docker run --rm -v "${PWD}/out:/app/out" ac2re-carto-build
   ```

If your shell does not support `${PWD}` (for example, Windows Command Prompt), use an absolute path:

```bash
docker run --rm -v "C:/path/to/AC2RECarto/out:/app/out" ac2re-carto-build
```

## Windows Smart App Control (EXE blocked)

If Windows shows "Smart App Control blocked a potentially dangerous app", the app is usually unsigned (or signed without enough reputation).

For distribution builds, sign the executable with an Authenticode certificate.
Electron Forge in this project will sign automatically when these environment variables are set:

- `WIN_CSC_LINK` or `WINDOWS_CERTIFICATE_FILE`: path to your `.pfx` certificate
- `WIN_CSC_KEY_PASSWORD` or `WINDOWS_CERTIFICATE_PASSWORD`: certificate password
- Optional: `WINDOWS_TIMESTAMP_SERVER` (defaults to `http://timestamp.digicert.com`)

Example (PowerShell):

```powershell
$env:WIN_CSC_LINK="C:\certs\my-cert.pfx"
$env:WIN_CSC_KEY_PASSWORD="your-password"
npm run make
```

Notes:

- Smart App Control/SmartScreen reputation can still require time on newly signed apps.
- EV code-signing certificates generally build trust faster.

## Contributing

Contributions are welcome! If you'd like to contribute to Cartographer of Asheron's Call 2, please follow these guidelines:

1. Fork the repository and create your branch from `main`.
2. Make your changes and ensure they align with the project's coding style.
3. Test your changes thoroughly.
4. Open a pull request with a clear description of your changes.

## License

This project is licensed under the ISC License - see the [LICENSE](https://www.isc.org/licenses/) file for details.

## Acknowledgments

- Thanks to the ElectronJS and Leaflet communities for providing excellent tools and documentation.
- Inspiration drawn from the vibrant world of Asheron's Call 2 and its dedicated community.
