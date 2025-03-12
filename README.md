# Mermaid to Image Chrome扩展

一个Chrome扩展，用于从网页中提取Mermaid图表并转换为图片。

## 功能特点

- 在网页中预览Mermaid图表
- 提取网页中的Mermaid语法代码
- 将Mermaid图表导出为SVG、PNG、JPEG格式
- 调试模式，便于检查渲染过程和错误信息

## 技术架构

### 核心组件

扩展包含以下主要组件：

1. **弹出界面 (Popup)**: 用于插件控制和功能入口
2. **内容脚本 (Content Script)**: 注入到网页中，用于提取和显示Mermaid图表
3. **背景脚本 (Background)**: 处理Chrome API和跨组件通信
4. **Mermaid渲染器 (Renderer)**: 在沙盒iframe环境中安全渲染Mermaid图表

### 关键技术点

- **React + TypeScript**: 用于构建用户界面
- **Tailwind CSS**: 提供样式支持
- **Webpack**: 打包和构建流程管理
- **Mermaid**: 用于图表渲染的核心库 (v11.4.1)
- **html-to-image**: 用于图表导出功能

### 安全沙盒设计

为确保安全，Mermaid渲染过程被隔离在沙盒iframe中执行，通过postMessage进行通信，防止潜在的XSS风险。

## 开发与构建

### 环境需求

- Node.js (v16+)
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
```

### 生产构建

```bash
npm run build
# 或
yarn build
```

构建后的文件位于 `dist` 目录中，可直接加载到Chrome扩展中进行测试。

## 项目架构说明

### 文件结构

```
├── src/
│   ├── background/         # 背景脚本
│   ├── components/         # React组件
│   ├── content/            # 内容脚本
│   ├── popup/              # 弹窗界面
│   ├── renderer/           # Mermaid渲染器
│   └── styles/             # 全局样式
├── icons/                  # 图标资源
├── manifest.json           # 扩展清单文件
├── webpack.config.js       # Webpack配置
└── package.json            # 项目配置和依赖
```

### 渲染流程

1. 用户在界面中输入或从网页提取Mermaid语法
2. 内容被发送到沙盒iframe (mermaid-renderer.html)
3. 渲染器使用Mermaid库解析和渲染图表
4. 结果通过postMessage返回给主界面
5. 用户可以预览并下载渲染好的图表

## 最佳实践与设计原则

- **模块化**: 每个功能都被封装为独立的组件和模块
- **类型安全**: 使用TypeScript确保代码质量和可维护性
- **安全第一**: 使用沙盒隔离和CSP策略防止安全风险
- **性能优化**: 使用延迟加载和防抖技术优化性能
- **依赖管理**: 所有外部库通过npm集中管理，便于更新和维护
- **构建优化**: 使用Webpack处理资源打包、代码分割和优化

## 贡献指南

欢迎提交Issues和Pull Requests，共同改进这个项目！

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