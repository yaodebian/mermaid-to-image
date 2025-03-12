# Chrome扩展开发最佳实践

本文档总结了在Chrome扩展开发中的一些最佳实践，特别是在Manifest V3环境下处理Service Worker和内容安全策略(CSP)的方法。

## Service Worker最佳实践

### 生命周期管理

Chrome扩展中的Service Worker有以下生命周期特性：
- 在没有活动时，大约30秒后会自动终止
- 在收到消息或事件时会自动激活
- 打开DevTools调试时会保持活跃状态

最佳实践：
1. 设计为无状态：不要在Service Worker中保存重要状态数据
2. 使用持久化存储：重要数据应存储在storage API中
3. 事件驱动设计：通过监听事件触发操作，而非持续运行

### API兼容性

Manifest V3中的Service Worker API变更：
- ❌ 移除了`chrome.tabs.executeScript`
- ✅ 新增了`chrome.scripting.executeScript`
- ❌ 不支持直接DOM操作

代码示例：
```typescript
// ❌ 旧API (不兼容Manifest V3)
chrome.tabs.executeScript(
  { code: 'window.getSelection().toString();' },
  (selection) => {
    // 处理结果
  }
);

// ✅ 新API (兼容Manifest V3)
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  if (tabs[0]?.id) {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => window.getSelection()?.toString() || '',
    });
    // 处理结果
  }
});
```

### 服务工作者注册失败问题排查

常见的Service Worker注册失败（Status code: 15）原因及解决方案：

1. **使用了不兼容的API**：
   - 检查是否使用了不兼容Manifest V3的API
   - 使用Chrome DevTools检查Service Worker错误

2. **CSP违规**：
   - 检查生成的JS代码是否包含eval
   - 配置webpack使用source-map而非eval

3. **语法或运行时错误**：
   - 检查Service Worker代码中的语法错误
   - 确保所有依赖正确加载

## 内容安全策略(CSP)最佳实践

### 理解Manifest V3中的CSP限制

Manifest V3中的CSP限制：
- 默认禁用`eval`、`new Function()`等动态代码执行方法
- 要求所有脚本来源明确声明
- 禁止内联脚本，除非在特定场景下使用`unsafe-inline`

### CSP配置示例

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'",
  "sandbox": "sandbox allow-scripts allow-forms allow-popups; script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; object-src 'self'"
}
```

### 使用沙盒页面

对于需要更宽松CSP的场景，使用沙盒页面是最佳解决方案：

1. 在manifest.json中配置沙盒页面：
```json
"sandbox": {
  "pages": ["sandbox-page.html"]
}
```

2. 为沙盒页面设置特殊CSP规则：
```json
"content_security_policy": {
  "sandbox": "sandbox allow-scripts allow-forms; script-src 'self' https://example.com 'unsafe-inline'; object-src 'self'"
}
```

3. 通过postMessage与沙盒页面通信：
```javascript
// 主扩展代码
const iframe = document.createElement('iframe');
iframe.src = chrome.runtime.getURL('sandbox-page.html');
document.body.appendChild(iframe);

// 发送消息到沙盒
iframe.addEventListener('load', () => {
  iframe.contentWindow.postMessage({ type: 'EXECUTE_CODE', code: '...' }, '*');
});

// 接收沙盒的消息
window.addEventListener('message', (event) => {
  if (event.data.type === 'RESULT') {
    // 处理结果
  }
});
```

## Webpack配置最佳实践

### 避免生成含eval的代码

```javascript
// webpack.config.js
module.exports = {
  mode: 'development',
  // 使用source-map而非eval避免CSP问题
  devtool: 'source-map',
  // 其他配置...
  optimization: {
    // 禁用开发模式下的eval
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
  },
};
```

### 清理构建目录

确保每次构建前清空dist目录：

```javascript
// webpack.config.js
module.exports = {
  // ...
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true, // 添加此配置自动清理dist目录
  },
  // ...
};
```

## 调试技巧

1. **检查Service Worker状态**：
   - 访问`chrome://extensions`
   - 点击"Service Worker (inactive)"链接打开DevTools

2. **查看CSP错误**：
   - 在DevTools的Console选项卡中查找CSP违规提示
   - 错误通常会指明哪些指令违反了CSP

3. **验证扩展权限**：
   - 确保manifest.json中包含所需的权限
   - 使用最小必要权限原则 