# Mermaid预览与提取Chrome插件 - 技术方案文档

## 技术栈
- **前端框架**：React + TypeScript
- **UI组件**：TailwindCSS
- **Mermaid处理**：mermaid.js
- **图像转换**：html-to-image
- **Chrome API**：chrome.tabs, chrome.scripting, chrome.runtime
- **通信机制**：postMessage

## 系统架构
插件将分为四个主要部分：
1. **Popup界面**：用户主要交互入口
2. **Content Script**：处理页面内容和图表提取
3. **Background Script**：处理后台任务和通信（Service Worker）
4. **沙盒渲染页面**：独立的HTML页面，在沙盒iframe中执行Mermaid渲染

## Manifest V3兼容性考量

### Service Worker限制
在Manifest V3中，background脚本以Service Worker形式运行，具有以下限制：
1. 生命周期有限：在空闲30秒后会被终止
2. 不支持DOM操作：无法直接操作DOM或访问window对象
3. API变更：很多API被废弃或替换，如executeScript被scripting.executeScript替代

### 内容安全策略(CSP)限制
Manifest V3对CSP要求更加严格：
1. 默认禁用eval和unsafe-inline：不允许使用eval()、Function构造函数等动态代码执行
2. 扩展页面的脚本必须来自扩展包内，外部脚本需在CSP中明确允许

### 解决方案
1. 使用Chrome沙盒：在沙盒页面中执行需要特殊权限的代码
2. Webpack优化：使用source-map替代eval，避免生成包含eval的代码
3. API更新：使用新版Chrome API替代旧版API

## 文件结构
```
mermaid-to-image/
├── dist/                # 构建输出目录
├── icons/               # 图标文件
├── src/
│   ├── background/      # 后台脚本
│   │   └── index.ts
│   ├── components/      # React组件
│   │   ├── MermaidExtractor.tsx
│   │   └── MermaidPreview.tsx
│   ├── content/         # 内容脚本
│   │   ├── index.ts
│   │   └── renderUtils.tsx
│   ├── popup/           # 弹出窗口
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── Popup.tsx
│   ├── styles/          # 样式文件
│   │   └── tailwind.css
│   ├── types/           # 类型定义
│   │   └── global.d.ts
├── public/              # 公共资源
│   ├── manifest.json    # 扩展清单文件
│   ├── mermaid-renderer.html  # 沙盒渲染页面
│   └── mermaid-script.js      # Mermaid渲染脚本
├── manifest.json        # 根目录清单文件
├── package.json         # 项目依赖
├── tsconfig.json        # TypeScript配置
├── webpack.config.js    # Webpack配置
└── tailwind.config.js   # TailwindCSS配置
```

## 核心功能实现方案

### 1. Mermaid预览功能
- 使用`<textarea>`接收用户输入的Mermaid文本
- 使用沙盒iframe加载独立的渲染页面，隔离Mermaid.js执行环境
- 通过postMessage API在主页面和iframe之间通信
- 使用html-to-image将SVG转换为PNG/JPEG格式

#### 关键实现细节
- 沙盒iframe渲染器设置：
  ```html
  <iframe
    ref={iframeRef}
    src="mermaid-renderer.html"
    className="border-0 w-full h-full min-h-[200px]"
    sandbox="allow-scripts allow-same-origin"
    onLoad={handleIframeLoad}
    title="Mermaid渲染"
  />
  ```

- 使用postMessage API发送Mermaid文本到iframe：
  ```typescript
  const sendMermaidToIframe = (code: string) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'render-mermaid',
        code: code
      }, '*');
    }
  };
  ```

- 监听来自iframe的渲染结果：
  ```typescript
  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'mermaid-rendered') {
      if (event.data.success) {
        setError(null);
        // 处理成功信息
      } else {
        setError(event.data.error || '渲染失败');
      }
    }
  };
  ```

### 2. Mermaid图表提取功能
- 通过Content Script扫描页面，识别Mermaid文本元素
- 使用多种选择器匹配不同工具生成的Mermaid图表
- 提取原始Mermaid文本并发送回扩展
- 使用相同的iframe沙盒渲染机制预览提取的图表

#### 提取策略
1. 查找具有特定类名或属性的元素
   ```typescript
   const selectors = [
     // 常见的mermaid类或标记
     '.mermaid', 
     '[data-mermaid]',
     '[data-diagram-source]',
     'pre.language-mermaid',
     // GitHub风格的代码块
     'pre[lang="mermaid"]',
     // 通用代码块中可能的mermaid
     'pre code.language-mermaid',
     'code.language-mermaid',
     'pre.mermaid-pre',
     // Markdown预览中的容器
     '.markdown-body .mermaid',
     '.markdown-preview .mermaid',
     // 自定义容器
     '[data-type="mermaid"]',
     '.mermaid-diagram'
   ];
   ```

2. 提取文本的多种方法：
   - 检查data-content属性
   - 检查data-diagram-source属性
   - 对于pre或code元素直接获取文本内容
   - 检查data-original、data-source等属性

### 3. 沙盒渲染器实现
- 使用Chrome扩展的沙盒特性和独立的HTML页面：
  ```json
  "sandbox": {
    "pages": ["mermaid-renderer.html"]
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'",
    "sandbox": "sandbox allow-scripts allow-forms allow-popups; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval'; object-src 'self'"
  }
  ```

- 独立的mermaid-script.js实现动态加载Mermaid库：
  ```javascript
  // 动态加载Mermaid库
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
  script.onload = function() {
    // Mermaid加载完成后初始化
    initializeMermaid();
  };
  document.head.appendChild(script);
  ```

- 初始化Mermaid并监听渲染请求：
  ```javascript
  function initializeMermaid() {
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        // 禁用一些可能导致问题的功能
        er: { useMaxWidth: false },
        flowchart: { useMaxWidth: false },
        sequence: { useMaxWidth: false },
        journey: { useMaxWidth: false }
      });
      
      // 通知父窗口Mermaid已加载
      window.parent.postMessage({ type: 'mermaid-ready' }, '*');
    }
  }
  
  window.addEventListener('message', async function(event) {
    if (event.data && event.data.type === 'render-mermaid') {
      renderMermaidChart(event.data.code);
    }
  });
  ```

### 4. 消息通信
- Popup到Content Script的消息传递：
  ```typescript
  // 向当前标签页发送消息，请求内容脚本执行提取
  const response = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = response[0];
  
  if (!currentTab?.id) {
    throw new Error('无法获取当前标签页');
  }
  
  // 注入内容脚本
  await chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    func: extractMermaidContent,
  });
  ```
- 从Content Script返回提取结果：
  ```typescript
  // 向扩展发送结果
  chrome.runtime.sendMessage({
    type: 'mermaid-extracted',
    items: results,
    error: results.length === 0 ? '未在页面中找到任何Mermaid图表' : null
  });
  ```

## 安全处理
- **内容安全策略(CSP)处理**：
  - 扩展页面严格遵循安全策略，不使用不安全的指令：
  ```json
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
  ```
  - 为沙盒页面设置单独的CSP，允许使用Mermaid库所需的功能：
  ```json
  "sandbox": "sandbox allow-scripts allow-forms allow-popups; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline' 'unsafe-eval'; object-src 'self'"
  ```

- **Web可访问资源**：
  - 配置允许访问渲染器页面和脚本：
  ```json
  "web_accessible_resources": [
    {
      "resources": ["mermaid-renderer.html", "mermaid-script.js"],
      "matches": ["<all_urls>"]
    }
  ]
  ```

- **沙盒隔离**：
  - 使用Chrome扩展的沙盒特性隔离Mermaid执行环境：
  ```json
  "sandbox": {
    "pages": ["mermaid-renderer.html"]
  }
  ```
  - 使用iframe sandbox属性限制权限：
  ```html
  sandbox="allow-scripts allow-same-origin"
  ```

## Manifest V3 CSP 解决方案

为了解决Mermaid库在Manifest V3中对`'unsafe-eval'`的依赖问题，我们采用了以下方案：

1. **沙盒隔离**：将Mermaid渲染逻辑完全隔离在沙盒页面中执行
2. **消息通信**：使用postMessage在主扩展和沙盒页面之间安全通信
3. **动态脚本加载**：在沙盒环境中动态加载Mermaid库
4. **自定义CSP规则**：为沙盒页面单独设置宽松的CSP规则

这种方案的优势：
- 完全兼容Manifest V3的安全要求
- 不需要修改Mermaid库的源代码
- 保留Mermaid所有原生功能
- 提供清晰的错误处理机制

## 构建与部署
- 使用Webpack构建项目
- TypeScript类型检查
- 使用PostCSS处理样式
- 打包为Chrome扩展格式 