const multer = require('multer');
const unionby = require('lodash.unionby');
const { imgDiff } = require('img-diff-js');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const mustacheExpress = require('mustache-express');
const express = require('express');
const bodyParser = require('body-parser');
const DEFAULT_REG_DATA = require('./defaultReg');

const SERVICE_DIR = 'image-diff-service';
const ACTUAL_DIR = path.join(SERVICE_DIR, 'actual');
const EXPECTED_DIR = path.join(SERVICE_DIR, 'expected');
const DIFF_DIR = path.join(SERVICE_DIR, 'diff');
const REG_FILE_PATH = path.join(SERVICE_DIR, 'reg.json');
const ASSETS_DIR = path.join(__dirname, 'assets');

const app = express();
app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, './views'));
app.use(express.static(SERVICE_DIR));
app.use(cors());
app.use(bodyParser.json()); //数据JSON类型
app.use(bodyParser.urlencoded({ extended: false }));

if (!fs.existsSync(SERVICE_DIR)) {
  fs.mkdirSync(SERVICE_DIR);
  fs.mkdirSync(ACTUAL_DIR);
  fs.mkdirSync(EXPECTED_DIR);
  fs.mkdirSync(DIFF_DIR);
  fs.copyFileSync(path.join(ASSETS_DIR, 'detector.wasm'), path.join(SERVICE_DIR, 'detector.wasm'));
  fs.copyFileSync(path.join(ASSETS_DIR, 'report.js'), path.join(SERVICE_DIR, 'report.js'));
  fs.copyFileSync(path.join(ASSETS_DIR, 'worker.js'), path.join(SERVICE_DIR, 'worker.js'));
  fs.copyFileSync(path.join(ASSETS_DIR, 'worker-dev.js'), path.join(SERVICE_DIR, 'worker-dev.js'));
}
fs.writeFileSync(REG_FILE_PATH, JSON.stringify(DEFAULT_REG_DATA, ' ', 2));

// 设置文件的存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ACTUAL_DIR);
  },
  filename: (req, file, cb) => {
    req.uploadFileName = file.originalname;
    cb(null, req.uploadFileName);
  },
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  const reg = fs.readFileSync(REG_FILE_PATH, 'utf-8');
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
  upload.single('file')(req, res, () => {
    const reg = JSON.parse(fs.readFileSync(REG_FILE_PATH, 'utf-8'));
    const expectedFilename = `${EXPECTED_DIR}/${req.uploadFileName}`;
    if (!fs.existsSync(expectedFilename)) {
      reg.newItems = addRegItem(reg.newItems, req.uploadFileName);
      fs.writeFileSync(REG_FILE_PATH, JSON.stringify(reg, ' ', 2));
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
    }).then((result) => {
      if (result.imagesAreSame) {
        reg.passedItems = addRegItem(reg.passedItems, req.uploadFileName);
        result.type = 'passed';
      } else {
        reg.failedItems = addRegItem(reg.failedItems, req.uploadFileName);
        result.type = 'changed';
      }
      fs.writeFileSync(REG_FILE_PATH, JSON.stringify(reg, ' ', 2));
      result.uploadFileName = req.uploadFileName;

      res.json(result);
    });
  });
});

const addRegItem = (items, itemName) => {
  items.push({ raw: itemName, encoded: encodeURI(itemName) });
  return unionby(items, (item) => item.raw);
};

module.exports = app;
