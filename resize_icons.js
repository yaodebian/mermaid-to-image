const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function resizeIcon(sourcePath, targetPath, size) {
  try {
    // 加载源图像
    const image = await loadImage(sourcePath);
    
    // 创建目标Canvas
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 绘制图像并调整大小
    ctx.drawImage(image, 0, 0, size, size);
    
    // 将Canvas转换为PNG并保存
    const out = fs.createWriteStream(targetPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    
    return new Promise((resolve, reject) => {
      out.on('finish', () => {
        console.log(`Resized icon saved to ${targetPath}`);
        resolve();
      });
      out.on('error', reject);
    });
  } catch (error) {
    console.error(`Error resizing icon: ${error.message}`);
    throw error;
  }
}

// 如果没有canvas模块，提示安装
try {
  if (!require.resolve('canvas')) {
    console.error('Please install the canvas module: npm install canvas');
    process.exit(1);
  }
} catch (e) {
  console.error('Please install the canvas module: npm install canvas');
  process.exit(1);
}

// 递归创建目录
function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExists(dirname);
  fs.mkdirSync(dirname);
}

// 主函数
async function main() {
  const sourceIcon = 'icons/icon128.png';
  const sizes = [16, 32, 48, 128];
  
  try {
    for (const size of sizes) {
      const targetPath = `icons/icon${size}.png`;
      ensureDirectoryExists(targetPath);
      await resizeIcon(sourceIcon, targetPath, size);
    }
    console.log('All icons resized successfully!');
  } catch (error) {
    console.error('Failed to resize icons:', error);
  }
}

main(); 