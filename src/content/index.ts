import '../styles/tailwind.css';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { renderPreviewLayer, renderExtractLayer } from './renderUtils';

// 用于保存浮层的根元素
let floatingContainer: HTMLElement | null = null;
let overlayElement: HTMLElement | null = null;
let reactRoot: ReturnType<typeof createRoot> | null = null;

// 阻止事件冒泡和默认行为
const preventSimpleEvents = (e: Event) => {
  e.stopPropagation();
  e.preventDefault();
};

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message) => {
  console.log('Content script收到消息:', message);
  if (message.action === 'openPreview') {
    showPreviewLayer();
  } else if (message.action === 'extractMermaid') {
    showExtractLayer();
  }
});

// 创建预览浮层
const showPreviewLayer = () => {
  // 清理已存在的浮层
  cleanupExistingLayer();
  
  // 创建新的浮层
  floatingContainer = createFloatingContainer('Mermaid预览');
  
  // 渲染预览组件
  if (floatingContainer) {
    // 创建React根元素
    const root = createRoot(floatingContainer);
    reactRoot = root;
    
    // 渲染预览组件
    root.render(
      React.createElement(renderPreviewLayer, {
        onClose: cleanupFloatingContainer
      })
    );
  }
};

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
      React.createElement(renderExtractLayer, {
        onClose: cleanupFloatingContainer
      })
    );
  }
};

// 创建浮动容器
function createFloatingContainer(title: string = 'Mermaid') {
  // 创建遮罩层防止事件穿透
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
      container.style.maxHeight = 'none';
    } else {
      contentArea.style.display = 'block';
      container.style.height = '85%';
      container.style.maxHeight = '700px';
    }
  });
  
  return contentArea;
}

// 阻止事件穿透
function preventAllEvents(element: HTMLElement) {
  const events = ['click', 'mousedown', 'mouseup', 'mousemove', 'touchstart', 
                 'touchend', 'touchmove', 'wheel', 'scroll'];
  
  events.forEach(eventType => {
    element.addEventListener(eventType, preventSimpleEvents, { passive: false });
  });
}

// 清理浮动容器
function cleanupFloatingContainer() {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }
  
  if (floatingContainer) {
    // 查找父元素（整个容器）
    const containerParent = floatingContainer.parentElement;
    if (containerParent) {
      document.body.removeChild(containerParent);
    }
    floatingContainer = null;
  }
  
  if (overlayElement) {
    document.body.removeChild(overlayElement);
    overlayElement = null;
  }
}

// 清理现有浮层
const cleanupExistingLayer = () => {
  if (floatingContainer || overlayElement) {
    cleanupFloatingContainer();
  }
};

console.log('Mermaid to Image: 内容脚本已加载'); 