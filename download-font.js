const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// IconFont 字体文件
const fontUrl = 'https://at.alicdn.com/t/font_8d5l8fzk5b87iymi.ttf';
const fontPath = path.join(fontsDir, 'iconfont.ttf');

console.log('正在下载 IconFont 字体...');

https.get(fontUrl, (res) => {
  if (res.statusCode === 302 || res.statusCode === 301) {
    // 重定向
    const redirectUrl = res.headers.location;
    console.log('重定向到:', redirectUrl);
    https.get(redirectUrl, (res2) => {
      const file = fs.createWriteStream(fontPath);
      res2.pipe(file);
      file.on('finish', () => {
        console.log('字体下载完成!');
        console.log('文件大小:', fs.statSync(fontPath).size, 'bytes');
      });
    }).on('error', (e) => console.log('下载失败:', e.message));
  } else {
    const file = fs.createWriteStream(fontPath);
    res.pipe(file);
    file.on('finish', () => {
      console.log('字体下载完成!');
    });
  }
}).on('error', (e) => console.log('下载失败:', e.message));
