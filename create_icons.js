const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

// 创建简单的图标
async function createIcon(targetPath, size) {
  try {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 背景
    ctx.fillStyle = '#4066E0';
    ctx.fillRect(0, 0, size, size);
    
    // 画一个简单的M作为Mermaid的标志
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', size / 2, size / 2);
    
    // 保存PNG
    const out = fs.createWriteStream(targetPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    
    return new Promise((resolve, reject) => {
      out.on('finish', () => {
        console.log(`Icon created at ${targetPath}`);
        resolve();
      });
      out.on('error', reject);
    });
  } catch (error) {
    console.error(`Error creating icon: ${error.message}`);
    throw error;
  }
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
  const sizes = [16, 32, 48, 128];
  
  try {
    for (const size of sizes) {
      const targetPath = `icons/icon${size}.png`;
      ensureDirectoryExists(targetPath);
      await createIcon(targetPath, size);
    }
    console.log('All icons created successfully!');
  } catch (error) {
    console.error('Failed to create icons:', error);
  }
}

main(); 