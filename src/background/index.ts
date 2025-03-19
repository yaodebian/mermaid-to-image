import { Message } from '../types';

/**
 * 背景脚本 - 管理扩展功能和处理消息
 */
console.log('Mermaid图表提取器: 背景脚本已启动');

/**
 * 使图标可见
 */
async function showSidebarAction() {
  if ('action' in chrome) {
    try {
      await chrome.action.setIcon({
        path: {
          16: 'icons/icon16.png',
          32: 'icons/icon32.png',
          48: 'icons/icon48.png',
          128: 'icons/icon128.png'
        }
      });
    } catch (err) {
      console.error('设置图标失败:', err);
    }
  }
}

/**
 * 打开转换器页面
 * @param code 可选的初始Mermaid代码
 */
function openConverter(code?: string) {
  let url = chrome.runtime.getURL('converter.html');
  
  // 如果提供了代码，将其作为URL参数传递
  if (code) {
    url += `?code=${encodeURIComponent(code)}`;
  }
  
  chrome.tabs.create({ url });
}

/**
 * 处理来自内容脚本或弹出窗口的消息
 */
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  console.log('收到消息:', message.type);
  
  switch (message.type) {
    case 'CHARTS_DETECTED':
      // 当页面检测到图表时，显示图标
      showSidebarAction();
      break;
      
    case 'OPEN_CONVERTER':
      // 打开转换器页面
      openConverter(message.code);
      break;
  }
  
  return false; // 不需要异步响应
});

/**
 * 扩展安装或更新时的处理
 */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // 首次安装
    console.log('扩展已安装');
    
    // 可以在这里打开欢迎页面
    chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
  } else if (details.reason === 'update') {
    // 扩展更新
    console.log(`扩展已更新到版本 ${chrome.runtime.getManifest().version}`);
  }
});

/**
 * 点击扩展图标时直接打开Mermaid转图片工具
 */
chrome.action.onClicked.addListener((tab) => {
  // 打开Mermaid转图片工具页面
  chrome.tabs.create({ url: chrome.runtime.getURL('converter.html') });
});

// 浏览器启动事件
chrome.runtime.onStartup.addListener(() => {
  console.log('[Mermaid提取器] 浏览器已启动');
}); 