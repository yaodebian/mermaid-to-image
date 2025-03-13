import { Message } from '../types';

/**
 * 背景脚本 - 管理扩展功能和处理消息
 */
console.log('Mermaid图表提取器: 背景脚本已启动');

/**
 * 使已有的侧边栏按钮可见
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
 * 打开侧边栏
 */
async function openSidebar(tabId?: number) {
  try {
    // 检查是否支持sidePanel API
    if ('sidePanel' in chrome) {
      // 先设置侧边栏配置
      await chrome.sidePanel.setOptions({
        path: 'sidebar.html',
        enabled: true
      });
      
      // 如果提供了特定的标签页ID，则在该标签页打开侧边栏
      if (tabId) {
        await chrome.sidePanel.open({ tabId });
      } else {
        // 否则在当前激活的标签页打开
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab?.id) {
          await chrome.sidePanel.open({ tabId: activeTab.id });
        }
      }
    } else {
      console.warn('当前浏览器不支持侧边栏功能');
      // 回退方案：打开一个弹出窗口
      chrome.windows.create({
        url: chrome.runtime.getURL('sidebar.html'),
        type: 'popup',
        width: 400,
        height: 600
      });
    }
  } catch (err) {
    console.error('打开侧边栏失败:', err);
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
 * 打开预览页面
 * @param chartId 图表ID
 */
function openPreview(chartId: string) {
  const url = chrome.runtime.getURL(`preview.html?id=${encodeURIComponent(chartId)}`);
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
      // 可以在这里更新图标徽章，显示检测到的图表数量
      if (message.count > 0 && 'action' in chrome) {
        chrome.action.setBadgeText({ text: String(message.count) });
        chrome.action.setBadgeBackgroundColor({ color: '#4285F4' });
      }
      break;
      
    case 'OPEN_SIDEBAR':
      // 打开侧边栏
      if (sender.tab?.id) {
        openSidebar(sender.tab.id);
      } else {
        openSidebar();
      }
      break;
      
    case 'OPEN_CONVERTER':
      // 打开转换器页面
      openConverter(message.code);
      break;
      
    case 'OPEN_DIAGRAM_PREVIEW':
      // 打开预览页面
      if (message.chartId) {
        openPreview(message.chartId);
      }
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
 * 点击扩展图标时打开侧边栏
 */
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    openSidebar(tab.id);
  }
});

// 浏览器启动事件
chrome.runtime.onStartup.addListener(() => {
  console.log('[Mermaid提取器] 浏览器已启动');
}); 