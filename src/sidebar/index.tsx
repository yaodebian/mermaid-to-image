import React from 'react';
import { createRoot } from 'react-dom/client';
import SidebarApp from './SidebarApp';
import '../styles/tailwind.css';

/**
 * 侧边栏入口文件
 * 当侧边栏页面加载时，渲染SidebarApp组件到根DOM元素
 */
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <SidebarApp />
      </React.StrictMode>
    );
  } else {
    console.error('找不到root DOM元素，无法渲染侧边栏应用');
  }
}); 