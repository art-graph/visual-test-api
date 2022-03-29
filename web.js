const app = require('./index')
const port = 3000;

app.listen(port, () => {
    console.log(`visual test app listening on port ${port}`);
    console.log('=========================');
    console.log('/ [GET]: 显示测试报告');
    console.log('/init-snapshot [POST]: 初始化测试数据');
    console.log('/update-snapshot [POST]: 更新 expected image 数据(Copy \`actual\` to \`expected\`) ');
    console.log('/upload [POST]: 上传图片，判断图片视觉是否一致');
});