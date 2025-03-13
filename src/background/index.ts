// 监听安装和更新事件
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装
    console.log('Mermaid to Image 扩展已安装');
  } else if (details.reason === 'update') {
    // 更新
    console.log('Mermaid to Image 扩展已更新');
  }
});

// 监听来自popup或content script的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSelectedText') {
    // 获取选中的文本 - 更新为使用新的scripting API
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
    return true; // 将会异步发送响应
  } else if (message.action === 'openTab') {
    // 处理打开新标签页的请求
    try {
      chrome.tabs.create({ url: message.url }, (tab) => {
        console.log('已打开Mermaid预览标签页', tab.id);
        if (sendResponse) {
          sendResponse({ success: true, tabId: tab.id });
        }
      });
    } catch (error) {
      console.error('打开标签页失败:', error);
      if (sendResponse) {
        sendResponse({ success: false, error: String(error) });
      }
    }
    return true; // 将会异步发送响应
  }
}); 