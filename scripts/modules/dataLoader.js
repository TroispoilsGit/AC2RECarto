// scripts/modules/dataLoader.js
// Reads POI data files from the user-configured data directory.
// All file I/O uses the synchronous Node.js fs API, which is available in the
// Electron renderer because nodeIntegration is enabled.

const path = require('path')
const fs = require('fs')

import { getDataDirectory } from './appConfig.js'

/**
 * Loads and parses a single POI JSON file by its stem name (no extension).
 *
 * @param {string} name File stem, e.g. "town" for town.json.
 * @returns {Promise<object[]>} The parsed array of POI entries.
 */
export async function loadPoiFile(name) {
    const dataDirectory = await getDataDirectory()
    const filePath = path.join(dataDirectory, `${name}.json`)
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

/**
 * Returns a sorted list of all JSON file names found in the data directory.
 *
 * @returns {Promise<string[]>} File names including the `.json` extension.
 */
export async function listPoiFiles() {
    const dataDirectory = await getDataDirectory()
    const entries = fs.readdirSync(dataDirectory, { withFileTypes: true })

    return entries
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b))
}
