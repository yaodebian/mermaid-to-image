# Mermaid to Image Chrome扩展

一个用于预览和提取Mermaid图表的Chrome扩展。

## 功能

### Mermaid预览

- 在浮层中预览Mermaid文本
- 实时渲染Mermaid图表
- 支持下载为SVG、PNG、JPEG格式

### Mermaid提取

- 从当前页面提取Mermaid图表
- 导出为SVG、PNG、JPEG格式
- 提取原始Mermaid文本

## 特性

- 安全的渲染方式，使用Chrome扩展沙盒隔离Mermaid.js执行环境
- 完全符合Chrome扩展Manifest V3的内容安全策略(CSP)要求
- 优化的图表提取算法，支持多种网站的Mermaid实现
- 轻量级界面，快速响应

## 技术实现

- 使用React和TypeScript开发
- 采用TailwindCSS构建UI
- 通过Chrome扩展沙盒技术隔离Mermaid.js执行环境
- 使用postMessage API实现沙盒通信
- 采用html-to-image处理图像转换

## 安装

### 从Chrome网上应用店安装

*即将上架*

### 手动安装（开发模式）

1. 克隆或下载此仓库
2. 执行 `npm install` 安装依赖
3. 执行 `npm run build` 构建扩展
4. 打开Chrome浏览器，进入扩展管理页面（chrome://extensions/）
5. 开启"开发者模式"
6. 点击"加载已解压的扩展程序"，选择本项目的 `dist` 文件夹

## 开发

```bash
# 安装依赖
npm install

# 开发模式构建（带有监视文件变化）
npm run watch

# 生产模式构建
npm run prod
```

## 构建注意事项

- 每次构建会自动清理dist目录，确保不会有旧文件残留
- Webpack配置中使用source-map而非eval，避免CSP问题
- 开发时请注意查看控制台错误信息进行调试

## 使用方法

1. 点击扩展图标打开popup
2. 选择"预览"或"提取"功能
3. 预览模式：输入Mermaid文本，查看渲染结果，可下载为图像
4. 提取模式：自动提取页面上的Mermaid图表，可提取文本和下载图像

## 安全说明

本扩展通过以下方式遵守Chrome的内容安全策略要求：

1. 使用Chrome扩展沙盒技术：隔离Mermaid.js执行环境，安全地加载和执行Mermaid库
2. 扩展页面CSP配置：严格遵循安全标准 `script-src 'self'; object-src 'self'`
3. 沙盒页面CSP配置：单独为沙盒页面配置允许inline脚本和外部CDN的规则
4. 避免使用eval：webpack配置优化，使用source-map替代eval确保符合CSP要求

## Manifest V3兼容性

本扩展完全兼容Chrome扩展的Manifest V3规范，解决了常见的CSP限制问题：

```json
"sandbox": {
  "pages": ["mermaid-renderer.html"]
},
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'",
  "sandbox": "sandbox allow-scripts allow-forms allow-popups; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; object-src 'self'"
}
```

## 常见问题排查

### Service Worker注册失败（Status code: 15）
如果遇到Service Worker注册失败问题，可能的原因：
1. background.js中使用了不兼容Manifest V3的API（如executeScript）
2. 在webpack打包时出现问题

解决方法：
- 确保使用chrome.scripting.executeScript代替旧版chrome.tabs.executeScript
- 确保webpack配置正确，不使用eval相关功能

### 内容安全策略错误
如果遇到CSP错误（unsafe-eval, unsafe-inline等），解决方法：
1. 检查webpack配置，使用source-map而非eval
2. 避免使用需要eval的代码
3. 将需要特殊权限的代码移至沙盒页面执行

## 许可证

MIT 