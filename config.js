const path = require('path');

const SERVICE_DIR = 'image-diff-service';
const ACTUAL_DIR = path.join(SERVICE_DIR, 'actual');
const EXPECTED_DIR = path.join(SERVICE_DIR, 'expected');
const DIFF_DIR = path.join(SERVICE_DIR, 'diff');
const REG_FILE_PATH = path.join(SERVICE_DIR, 'reg.json');
const ASSETS_DIR = path.join(__dirname, 'assets');

module.exports = {
  SERVICE_DIR,
  ACTUAL_DIR,
  EXPECTED_DIR,
  DIFF_DIR,
  ASSETS_DIR,
  REG_FILE_PATH
}
