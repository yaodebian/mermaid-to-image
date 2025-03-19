import '../styles/tailwind.css';

console.log('Mermaid to Image: 内容脚本已加载');

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script收到消息:', message);
  
  // 这里不再需要处理任何消息，因为提取功能已移除
  // 保留此监听器以便将来扩展

  return true; // 允许异步响应
});

// 通知后台脚本内容脚本已加载
chrome.runtime.sendMessage({ action: 'contentScriptLoaded' });

console.log('Mermaid to Image: 内容脚本初始化完成'); 