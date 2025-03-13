import React from 'react';
import { createRoot } from 'react-dom/client';
import PopupApp from './PopupApp';
import '../styles/tailwind.css';

/**
 * 弹出窗口入口文件
 * 渲染插件弹出窗口
 */
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <PopupApp />
      </React.StrictMode>
    );
  } else {
    console.error('找不到根DOM元素');
  }
}); 