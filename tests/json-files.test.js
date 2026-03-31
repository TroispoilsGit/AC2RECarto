const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data');

test('data directory exists', () => {
  assert.equal(fs.existsSync(DATA_DIR), true, 'data directory is missing');
});

test('all data JSON files are valid arrays of POI objects', () => {
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((fileName) => fileName.toLowerCase().endsWith('.json'));

  assert.ok(files.length > 0, 'no JSON files found in data directory');

  files.forEach((fileName) => {
    const fullPath = path.join(DATA_DIR, fileName);
    const raw = fs.readFileSync(fullPath, 'utf8');
    let parsed;

    assert.doesNotThrow(() => {
      parsed = JSON.parse(raw);
    }, `${fileName} contains invalid JSON`);

    assert.ok(Array.isArray(parsed), `${fileName} must contain a JSON array`);

    parsed.forEach((item, index) => {
      assert.equal(typeof item, 'object', `${fileName}[${index}] must be an object`);
      assert.notEqual(item, null, `${fileName}[${index}] must not be null`);
      assert.equal(Number.isFinite(item.x), true, `${fileName}[${index}].x must be a finite number`);
      assert.equal(Number.isFinite(item.y), true, `${fileName}[${index}].y must be a finite number`);
    });
  });
});
