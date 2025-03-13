# Mermaid to Image Chrome扩展

一个Chrome扩展，用于从网页中提取Mermaid图表并转换为图片。

## 最近更新

### 2025年03月12日最新修复

我们修复了几个影响用户体验的问题：

1. **语法报错显示重复问题**
   - **问题**：当Mermaid语法有错误时，错误信息会在界面中显示两次
   - **解决方案**：重构了错误处理机制，将错误显示责任完全交给沙盒iframe，避免在组件中重复显示
   - **技术细节**：移除了MermaidPreview组件中的RenderError显示，保留错误状态跟踪但不再重复渲染

2. **清空编辑框时渲染不清空问题**
   - **问题**：当用户清空编辑框时，渲染区域仍然显示旧内容
   - **解决方案**：实现了专门的清空命令通信机制，在清空编辑框时主动通知渲染器清空内容
   - **技术细节**：添加了`clear-mermaid`消息类型，在编辑框清空和点击清空按钮时触发，确保渲染区域同步更新

3. **渲染错误时显示冗余错误信息**
   - **问题**：渲染错误时会同时显示组件内自定义错误视图和Mermaid官方错误视图
   - **解决方案**：统一了错误显示逻辑，确保只显示一次格式一致的错误信息
   - **技术细节**：优化了错误处理流程，改进了`showSyntaxError`函数，统一了错误信息格式和显示样式

### 其他优化

- **改进通信机制**：使用requestId参数跟踪渲染请求，确保消息正确匹配处理
- **增强调试能力**：添加更详细的日志记录，方便开发者排查问题
- **优化界面反馈**：提供更清晰的错误提示和加载状态指示
- **安全渲染**：增强了沙盒iframe的渲染隔离和通信安全
- **自适应高度**：渲染区域现在可以根据图表实际大小自动调整高度，提供更好的视觉体验

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

## 排错指南

### 常见问题及解决方案

1. **预览弹窗不显示**
   - 确保内容脚本已正确注入，检查manifest.json中的content_scripts配置
   - 查看浏览器控制台是否有错误信息
   - 尝试重新加载扩展

2. **渲染错误**
   - 确认Mermaid语法是否正确
   - 检查调试模式下的日志信息，了解具体错误原因
   - 参考[Mermaid官方语法文档](https://mermaid.js.org/syntax/flowchart.html)

3. **图表导出问题**
   - 确保渲染成功后再尝试导出
   - 对于特别复杂的图表，可以尝试调整缩放比例后导出

### 开发调试技巧

- 启用调试模式查看详细日志信息
- 使用Chrome开发者工具检查扩展的background和content页面
- 查看沙盒iframe的控制台输出，找出渲染过程中的问题

## 安全说明

本扩展通过以下方式遵守Chrome的内容安全策略要求：

1. 使用Chrome扩展沙盒技术：隔离Mermaid.js执行环境，安全地加载和执行Mermaid库
2. 扩展页面CSP配置：严格遵循安全标准 `script-src 'self'; object-src 'self'`
3. 沙盒页面CSP配置：单独为沙盒页面配置允许inline脚本和外部CDN的规则
4. 避免使用eval：webpack配置优化，使用source-map替代eval确保符合CSP要求

## 许可证

MIT 