const multer = require('multer');


module.exports = function(storageDir){
  // 设置文件的存储
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, storageDir);
    },
    filename: (req, file, cb) => {
      req.uploadFileName = file.originalname;
      cb(null, req.uploadFileName);
    },
  });
  return multer({ storage: storage })
};
