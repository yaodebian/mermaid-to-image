import '../styles/tailwind.css';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { MermaidExtractor } from './renderUtils';
import { detectMermaidDiagrams } from '../services/diagram-detector';
import { DetectionResult } from '../types/diagram';
import { MermaidChart } from '../types';
import { DiagramDetectionService } from '../services/DiagramDetectionService';

// 用于保存浮层的根元素
let floatingContainer: HTMLElement | null = null;
let overlayElement: HTMLElement | null = null;
let reactRoot: ReturnType<typeof createRoot> | null = null;

/**
 * 存储检测到的图表
 */
let detectedCharts: MermaidChart[] = [];

// 阻止事件冒泡和默认行为
const preventSimpleEvents = (e: Event) => {
  e.stopPropagation();
  e.preventDefault();
};

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script收到消息:', message);
  
  try {
    if (message.action === 'extractMermaid') {
      showExtractLayer();
      // 发送成功响应
      sendResponse({ success: true });
    } else if (message.action === 'detectMermaidDiagrams') {
      console.log('[Mermaid提取器] 开始检测Mermaid图表');
      handleDetectDiagrams()
        .then((result) => {
          console.log(`[Mermaid提取器] 检测完成，找到 ${result.diagrams.length} 个图表`);
          sendResponse(result);
        })
        .catch((error) => {
          console.error('[Mermaid提取器] 检测出错:', error);
          sendResponse({ 
            success: false, 
            diagrams: [], 
            error: error instanceof Error ? error.message : '未知错误' 
          });
        });
      // 返回true表示将异步发送响应
      return true;
    } else if (message.type === 'DETECT_CHARTS') {
      detectDiagrams().then(charts => {
        sendResponse({ charts });
      });
      return true; // 异步响应
    }
  } catch (error) {
    console.error('处理消息时出错:', error);
    // 发送错误响应
    sendResponse({ success: false, error: String(error) });
  }
  
  // 返回true表示将异步发送响应
  return true;
});

/**
 * 处理检测Mermaid图表的请求
 */
async function handleDetectDiagrams(): Promise<DetectionResult> {
  try {
    // 检测页面中的Mermaid图表
    const result = await detectMermaidDiagrams();
    
    // 返回检测结果
    return result;
  } catch (error) {
    console.error('[Mermaid提取器] 检测过程出错:', error);
    return {
      success: false,
      diagrams: [],
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

// 创建提取浮层
const showExtractLayer = () => {
  // 清理已存在的浮层
  cleanupExistingLayer();
  
  // 创建新的浮层
  floatingContainer = createFloatingContainer('Mermaid图表提取');
  
  // 渲染提取组件
  if (floatingContainer) {
    // 创建React根元素
    const root = createRoot(floatingContainer);
    reactRoot = root;
    
    // 渲染提取组件
    root.render(
      React.createElement(MermaidExtractor, {
        onClose: cleanupFloatingContainer
      })
    );
  }
};

// 创建浮动容器
function createFloatingContainer(title: string = 'Mermaid') {
  console.log('开始创建浮动容器:', title);
  
  // 创建遮罩层防止事件穿透
  try {
    overlayElement = document.createElement('div');
    overlayElement.style.position = 'fixed';
    overlayElement.style.top = '0';
    overlayElement.style.left = '0';
    overlayElement.style.width = '100%';
    overlayElement.style.height = '100%';
    overlayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // 更深的遮罩颜色
    overlayElement.style.zIndex = '999999';
    overlayElement.style.backdropFilter = 'blur(3px)'; // 添加模糊效果
    document.body.appendChild(overlayElement);
    
    // 防止事件穿透
    preventAllEvents(overlayElement);
    
    // 创建悬浮容器
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.width = '90%';
    container.style.maxWidth = '900px';
    container.style.height = '85%';
    container.style.maxHeight = '700px';
    container.style.backgroundColor = 'white';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)'; // 更明显的阴影
    container.style.zIndex = '1000000';
    container.style.overflow = 'hidden';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    
    // 创建标题栏
    const titleBar = document.createElement('div');
    titleBar.style.display = 'flex';
    titleBar.style.justifyContent = 'space-between';
    titleBar.style.alignItems = 'center';
    titleBar.style.padding = '12px 16px';
    titleBar.style.borderBottom = '1px solid #eee';
    titleBar.style.backgroundColor = '#f8f9fa';
    titleBar.style.borderTopLeftRadius = '8px';
    titleBar.style.borderTopRightRadius = '8px';
    
    // 添加标题
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    titleElement.style.margin = '0';
    titleElement.style.fontSize = '16px';
    titleElement.style.fontWeight = 'bold';
    titleElement.style.color = '#333';
    titleBar.appendChild(titleElement);
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.lineHeight = '1';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#666';
    closeButton.style.padding = '0 5px';
    closeButton.style.marginLeft = '10px';
    closeButton.addEventListener('mouseover', () => {
      closeButton.style.color = '#333';
    });
    closeButton.addEventListener('mouseout', () => {
      closeButton.style.color = '#666';
    });
    
    closeButton.addEventListener('click', cleanupFloatingContainer);
    titleBar.appendChild(closeButton);
    
    // 添加标题栏到容器
    container.appendChild(titleBar);
    
    // 创建内容区域
    const contentArea = document.createElement('div');
    contentArea.style.padding = '16px';
    contentArea.style.overflowY = 'auto';
    contentArea.style.height = 'calc(100% - 50px)'; // 减去标题栏高度
    contentArea.style.boxSizing = 'border-box';
    container.appendChild(contentArea);
    
    // 将容器添加到页面
    document.body.appendChild(container);
    
    // 点击遮罩层关闭
    overlayElement.addEventListener('click', cleanupFloatingContainer);
    
    // 支持双击标题栏折叠/展开
    let isCollapsed = false;
    titleBar.addEventListener('dblclick', () => {
      isCollapsed = !isCollapsed;
      if (isCollapsed) {
        contentArea.style.display = 'none';
        container.style.height = 'auto';
      } else {
        contentArea.style.display = 'block';
        container.style.height = '85%';
      }
    });
    
    // 防止内部元素的事件触发外部事件
    preventAllEvents(container);
    
    return contentArea;
  } catch (error) {
    console.error('创建浮动容器出错:', error);
    return null;
  }
}

// 防止所有事件传播
function preventAllEvents(element: HTMLElement) {
  const events = ['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'touchstart', 'touchend', 'wheel'];
  events.forEach(event => {
    element.addEventListener(event, preventSimpleEvents, { capture: true });
  });
}

// 清理浮动容器
function cleanupFloatingContainer() {
  console.log('清理浮动容器');
  
  // 卸载React组件
  if (reactRoot) {
    try {
      reactRoot.unmount();
      reactRoot = null;
    } catch (error) {
      console.error('卸载React组件出错:', error);
    }
  }
  
  // 移除遮罩层
  if (overlayElement && overlayElement.parentNode) {
    overlayElement.parentNode.removeChild(overlayElement);
    overlayElement = null;
  }
  
  // 移除浮动容器
  if (floatingContainer && floatingContainer.parentNode) {
    floatingContainer.parentNode.removeChild(floatingContainer.parentNode);
    floatingContainer = null;
  }
}

// 清理已存在的浮层
const cleanupExistingLayer = () => {
  console.log('清理已存在的浮层');
  
  cleanupFloatingContainer();
};

// 通知后台脚本内容脚本已加载
chrome.runtime.sendMessage({ action: 'contentScriptLoaded' });

console.log('Mermaid to Image: 内容脚本已加载');

/**
 * 初始化内容脚本
 */
function init() {
  console.log('Mermaid图表提取器: 内容脚本已加载');
  
  // 页面完全加载后执行检测
  if (document.readyState === 'complete') {
    detectDiagrams();
  } else {
    window.addEventListener('load', () => {
      detectDiagrams();
    });
  }
  
  // 监听DOM变化，可能有新的图表添加
  observeDOMChanges();
}

/**
 * 检测页面中的Mermaid图表
 */
async function detectDiagrams(): Promise<MermaidChart[]> {
  // 清空之前的结果
  detectedCharts = [];
  
  // 查找所有可能包含Mermaid图表的元素
  const potentialElements = [
    ...document.querySelectorAll('pre code'),          // 代码块
    ...document.querySelectorAll('.mermaid'),          // 带有mermaid类的元素
    ...document.querySelectorAll('[data-diagram-source]')  // 带有data-diagram-source属性的元素
  ];
  
  // 遍历元素并检测
  for (const element of potentialElements) {
    const parentElement = element.tagName === 'CODE' ? element.parentElement! : element;
    const mermaidCode = DiagramDetectionService.detectMermaidFromElement(parentElement);
    
    if (mermaidCode) {
      const chartId = DiagramDetectionService.generateChartId(mermaidCode);
      
      // 检查是否已经存在相同ID的图表
      if (!detectedCharts.some(chart => chart.id === chartId)) {
        // 获取元素位置信息
        const rect = parentElement.getBoundingClientRect();
        const location = {
          selector: getElementPath(parentElement),
          position: {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX
          }
        };
        
        // 添加到检测结果
        detectedCharts.push({
          id: chartId,
          code: mermaidCode,
          location
        });
      }
    }
  }
  
  return detectedCharts;
}

/**
 * 获取元素的CSS选择器路径
 * @param element DOM元素
 * @returns 元素的CSS选择器路径
 */
function getElementPath(element: Element): string {
  const path: string[] = [];
  let currentElement: Element | null = element;
  
  while (currentElement && currentElement !== document.documentElement) {
    let selector = currentElement.tagName.toLowerCase();
    
    if (currentElement.id) {
      selector += `#${currentElement.id}`;
      path.unshift(selector);
      break;
    } else {
      const siblings = Array.from(currentElement.parentElement?.children || []);
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(currentElement);
        selector += `:nth-child(${index + 1})`;
      }
      
      path.unshift(selector);
      currentElement = currentElement.parentElement;
    }
  }
  
  return path.join(' > ');
}

/**
 * 监视DOM变化，检测新增的图表
 */
function observeDOMChanges() {
  const observer = new MutationObserver((mutations) => {
    let shouldRedetect = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length) {
        shouldRedetect = true;
        break;
      }
    }
    
    if (shouldRedetect) {
      // 延迟执行，避免频繁检测
      setTimeout(() => {
        detectDiagrams().then(charts => {
          if (charts.length > 0) {
            // 通知其他组件（如侧边栏）图表列表已更新
            chrome.runtime.sendMessage({
              type: 'MERMAID_CHARTS_UPDATED',
              charts
            });
          }
        });
      }, 500);
    }
  });
  
  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// 启动内容脚本
init(); 