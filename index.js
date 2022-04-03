
const unionby = require('lodash.unionby');
const { imgDiff } = require('img-diff-js');
const path = require('path');
const fs = require('fs')
const fsPromises = fs.promises;

const DEFAULT_REG_DATA = require('./defaultReg');
const CONFIG = require('./config');
const initDirectory = require('./initDirectory');
const initExpress = require('./initExpress');
const setStorage = require('./setStorage');

const { SERVICE_DIR, ACTUAL_DIR, EXPECTED_DIR,DIFF_DIR, REG_FILE_PATH } = CONFIG;
initDirectory(CONFIG, DEFAULT_REG_DATA);
const app = initExpress(SERVICE_DIR);
const upload = setStorage(CONFIG.ACTUAL_DIR);

const addRegItem = (items, itemName) => {
  items.push({ raw: itemName, encoded: encodeURI(itemName) });
  return unionby(items, (item) => item.raw);
};

app.get('/', async (req, res) => {
  const reg = await fsPromises.readFile(REG_FILE_PATH, 'utf-8');
  res.render('index.mustache', { reg });
});

app.post('/init-snapshot', async (req, res) => {
  await Promise.all([
    fsPromises.rmdir(ACTUAL_DIR, {
      recursive: true,
    }),
    fsPromises.rmdir(DIFF_DIR, {
      recursive: true,
    }),
  ]);
  await Promise.all([fsPromises.mkdir(ACTUAL_DIR), fsPromises.mkdir(DIFF_DIR)]);
  await fsPromises.writeFile(REG_FILE_PATH, JSON.stringify(DEFAULT_REG_DATA, ' ', 2));
  res.json({});
});

app.post('/update-snapshot', async (req, res) => {
  const itemName = req.body.name;
  await fsPromises.copyFile(path.join(ACTUAL_DIR, itemName), path.join(EXPECTED_DIR, itemName));
  const reg = JSON.parse(await fsPromises.readFile(REG_FILE_PATH, 'utf-8'));

  if (req.body.variant === 'new') {
    reg.newItems = reg.newItems.filter((item) => item.raw !== itemName);
  } else if (req.body.variant === 'changed') {
    reg.failedItems = reg.failedItems.filter((item) => item.raw !== itemName);
  }
  reg.passedItems = addRegItem(reg.passedItems, itemName);
  await fsPromises.writeFile(REG_FILE_PATH, JSON.stringify(reg, ' ', 2));
  res.json({});
});

app.post('/upload', (req, res) => {
  upload.single('file')(req, res, async () => {
    const reg = JSON.parse(await fsPromises.readFile(REG_FILE_PATH, 'utf-8'));
    const expectedFilename = `${EXPECTED_DIR}/${req.uploadFileName}`;
    if (!fs.existsSync(expectedFilename)) {
      reg.newItems = addRegItem(reg.newItems, req.uploadFileName);
      await fsPromises.writeFile(REG_FILE_PATH, JSON.stringify(reg, ' ', 2));
      res.json({
        imagesAreSame: false,
        type: 'new',
        uploadFileName: req.uploadFileName,
      });
      return;
    }

    imgDiff({
      actualFilename: `${ACTUAL_DIR}/${req.uploadFileName}`,
      expectedFilename: expectedFilename,
      diffFilename: `${DIFF_DIR}/${req.uploadFileName}`,
    }).then(async (result) => {
      if (result.imagesAreSame) {
        reg.passedItems = addRegItem(reg.passedItems, req.uploadFileName);
        result.type = 'passed';
      } else {
        reg.failedItems = addRegItem(reg.failedItems, req.uploadFileName);
        result.type = 'changed';
      }
      await fsPromises.writeFile(REG_FILE_PATH, JSON.stringify(reg, ' ', 2));
      result.uploadFileName = req.uploadFileName;

      res.json(result);
    });
  });
});

module.exports = app;
