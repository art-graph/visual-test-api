const fs = require('fs');
const path = require('path');

module.exports = function (config, defaultRegData) {
  const { SERVICE_DIR ,ACTUAL_DIR,EXPECTED_DIR, DIFF_DIR, REG_FILE_PATH , ASSETS_DIR} = config;
  if (!fs.existsSync(SERVICE_DIR)) {
    // 初始化目录
    fs.mkdirSync(SERVICE_DIR);
    fs.mkdirSync(ACTUAL_DIR);
    fs.mkdirSync(EXPECTED_DIR);
    fs.mkdirSync(DIFF_DIR);
    fs.copyFileSync(path.join(ASSETS_DIR, 'detector.wasm'), path.join(SERVICE_DIR, 'detector.wasm'));
    fs.copyFileSync(path.join(ASSETS_DIR, 'report.js'), path.join(SERVICE_DIR, 'report.js'));
    fs.copyFileSync(path.join(ASSETS_DIR, 'worker.js'), path.join(SERVICE_DIR, 'worker.js'));
    fs.copyFileSync(path.join(ASSETS_DIR, 'worker-dev.js'), path.join(SERVICE_DIR, 'worker-dev.js'));
    console.log('目录创建完成');
  }
  fs.writeFileSync(REG_FILE_PATH, JSON.stringify(defaultRegData, ' ', 2));
}
