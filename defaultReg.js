module.exports = {
  type: 'danger',
  hasNew: true,
  newItems: [],
  hasDeleted: true,
  deletedItems: [],
  hasPassed: true,
  passedItems: [],
  hasFailed: true,
  failedItems: [],
  actualDir: './actual',
  expectedDir: './expected',
  diffDir: './diff',
  ximgdiffConfig: {
    enabled: true,
    workerUrl: './worker.js',
  },
};
