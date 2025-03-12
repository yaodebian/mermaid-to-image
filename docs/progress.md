# Mermaid预览与提取Chrome插件 - 进度文档

## 开发进度跟踪

### 阶段一：基础结构搭建 (已完成)
- [x] 创建项目结构
- [x] 配置manifest.json
- [x] 设置基本build流程
- [x] 实现插件popup基础UI
- [x] 创建项目文档

### 阶段二：核心功能开发 (已完成)
- [x] 实现Mermaid文本预览功能
- [x] 开发组件结构
- [x] 实现SVG下载功能
- [x] 添加图像格式转换功能
- [x] 解决内容安全策略(CSP)问题

### 阶段三：图表提取功能 (已完成)
- [x] 实现页面Mermaid图表识别
- [x] 开发图表元素提取逻辑
- [x] 实现Mermaid文本提取功能
- [x] 添加图表预览与下载功能

### 阶段四：完善与优化 (已完成)
- [x] 用户界面优化
- [x] 性能优化
- [x] 添加错误处理
- [x] iframe沙盒渲染实现
- [x] 彻底解决CSP限制问题
- [x] 解决Service Worker注册失败问题
- [x] 优化webpack配置，确保不使用eval

### 阶段五：打包与发布 (进行中)
- [x] 代码整理与优化
- [x] 编写使用说明
- [x] 完善文档
- [ ] 打包插件
- [ ] 准备发布材料

## 已解决问题

### 内容安全策略(CSP)问题
- 问题：由于Chrome扩展的内容安全策略限制，不允许使用'unsafe-eval'，但mermaid.js依赖eval函数进行渲染
- 解决方案：
  1. ~~创建独立的HTML文件(mermaid-renderer.html)作为渲染器~~
  2. ~~使用iframe加载渲染器，提供沙盒环境隔离执行Mermaid.js~~
  3. ~~通过postMessage API在主扩展和iframe之间安全通信~~
  4. ~~在manifest.json中配置web_accessible_resources允许访问渲染器页面~~
  5. ~~移除'unsafe-eval'指令，使用标准CSP配置~~

#### 最终解决方案 (2024-03-11)
1. 使用Chrome扩展的沙盒特性
   - 在manifest.json中添加sandbox配置，指定mermaid-renderer.html为沙盒页面
   - 为沙盒页面单独设置CSP规则，允许使用unsafe-inline
   ```json
   "sandbox": {
     "pages": ["mermaid-renderer.html"]
   },
   "content_security_policy": {
     "extension_pages": "script-src 'self'; object-src 'self'",
     "sandbox": "sandbox allow-scripts allow-forms allow-popups; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; object-src 'self'"
   }
   ```

2. 创建独立的mermaid-script.js
   - 实现动态加载Mermaid库的逻辑
   - 通过postMessage与主扩展通信
   - 在沙盒环境中安全执行操作

3. 更新iframe通信机制
   - 实现基于postMessage的双向通信
   - 添加错误处理和状态反馈
   - 支持SVG尺寸信息传递

### Service Worker注册失败问题
- 问题：扩展加载时出现Service Worker注册失败（Status code: 15）错误
- 原因：
  1. background.js中使用了不兼容Manifest V3的API (chrome.tabs.executeScript)
  2. webpack配置生成包含eval的代码，违反CSP策略

#### 解决方案 (2024-03-11)
1. 更新background脚本中的API使用：
   - 将旧版chrome.tabs.executeScript替换为新版chrome.scripting.executeScript
   - 使用async/await处理异步操作
   - 改进错误处理机制
   ```typescript
   // 旧代码
   chrome.tabs.executeScript(
     { code: 'window.getSelection().toString();' },
     (selection) => {
       sendResponse({ text: selection[0] || '' });
     }
   );
   
   // 新代码
   chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
     if (tabs[0]?.id) {
       try {
         const results = await chrome.scripting.executeScript({
           target: { tabId: tabs[0].id },
           func: () => window.getSelection()?.toString() || '',
         });
         sendResponse({ text: results[0]?.result || '' });
       } catch (error: unknown) {
         console.error('执行脚本错误:', error);
         const errorMessage = error instanceof Error ? error.message : String(error);
         sendResponse({ text: '', error: errorMessage });
       }
     }
   });
   ```

2. 优化webpack配置：
   - 添加source-map配置，避免使用eval
   - 设置优化选项，确保不使用eval相关功能
   - 添加clean: true配置，每次构建前清理dist目录
   ```javascript
   // webpack.config.js
   module.exports = {
     mode: 'development',
     devtool: 'source-map',
     // ...其他配置
     output: {
       path: path.resolve(__dirname, 'dist'),
       filename: '[name].js',
       clean: true, // 自动清理dist目录
     },
     optimization: {
       minimize: true,
       moduleIds: 'deterministic',
       chunkIds: 'deterministic',
     },
     // ...其他配置
   };
   ```

### 图表提取问题
- 问题：不同网站的Mermaid图表实现方式各不相同，难以统一提取
- 解决方案：
  1. 使用多种选择器匹配不同实现方式的Mermaid图表
  2. 实现多种文本提取策略，提高成功率
  3. 使用chrome.scripting.executeScript注入提取脚本
  4. 通过消息传递机制将提取结果发送回扩展

### 图像导出问题
- 问题：访问iframe内容的跨域限制
- 解决方案：
  1. 通过iframe的contentDocument安全地访问SVG元素
  2. 使用SVG克隆和序列化技术导出SVG格式
  3. 采用html-to-image库处理PNG和JPEG格式的导出

## 近期更新

### 2024-03-11：解决Service Worker注册失败和webpack优化
- 更新background脚本，将不兼容的API替换为Manifest V3兼容的API
- 优化webpack配置，使用source-map替代eval，避免CSP违规
- 添加构建自动清理功能，确保每次构建前dist目录被清空
- 创建了详细的Chrome扩展最佳实践文档，专注于Service Worker和CSP问题
- 完善错误处理机制，提高扩展的稳定性和可靠性

### 2024-03-11：使用Chrome扩展沙盒彻底解决CSP问题
- 应用Chrome扩展的沙盒特性隔离Mermaid.js执行环境
- 重新设计渲染机制，使用独立的mermaid-script.js脚本动态加载Mermaid库
- 完善postMessage通信系统，实现更可靠的错误处理
- 更新manifest.json配置，为沙盒页面设置单独的CSP规则，移除unsafe-eval
- 重构MermaidPreview和MermaidExtractor组件，适配新的渲染机制
- 解决了在Manifest V3下无法使用eval()的问题，使扩展完全符合Chrome的安全要求

## 待解决问题

### 主题支持
- 需要添加对不同Mermaid主题的支持
- 计划添加主题选择选项

### 高级图表功能
- 需要支持Mermaid的更多高级功能和图表类型
- 需要测试不同类型图表的兼容性

### 图像导出配置
- 需要添加图像导出的更多选项
- 计划添加图像尺寸、背景色等设置

## 当前状态
项目已完成主要功能开发，彻底解决了核心的CSP问题和Service Worker注册失败问题，完全符合Chrome扩展的最新安全要求。已实现基本的Mermaid预览和提取功能，并优化了用户界面和错误处理。下一步计划添加更多设置选项和主题支持，提高用户体验，准备发布到Chrome网上应用店。 