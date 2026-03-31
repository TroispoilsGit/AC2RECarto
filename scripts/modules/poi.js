const path = require('path');
const fs = require('fs');
import { ensureDataDirectory } from './dataDirectory.js';

async function initPoImarker(name) {
    const dataDirectory = await ensureDataDirectory();
    const jsonName = path.join(dataDirectory, `${name}.json`);
    const result = JSON.parse(fs.readFileSync(jsonName, 'utf8'));
    return result;
}

export async function listPoiJsonFiles() {
    const dataDirectory = await ensureDataDirectory();
    const files = fs.readdirSync(dataDirectory, { withFileTypes: true });

    return files
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));
}

export default initPoImarker;