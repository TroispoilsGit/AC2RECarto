# Cartographer of Asheron's Call 2

![Cartographer Demo](demo.gif)

Cartographer of Asheron's Call 2 is a simple, lively 2D map tool built using ElectronJS and the Leaflet library. It aims to provide players of Asheron's Call 2 with an intuitive way to explore the game world and plan their adventures.

## Features

- **Interactive Map**: Explore the vast world of Asheron's Call 2 through an interactive 2D map interface.
- **POI Data Directory Picker**: Select the folder containing your POI `.json` files directly from the app (button or menu).
- **Persistent Data Folder**: The selected POI folder is saved and restored automatically when the app restarts.
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
