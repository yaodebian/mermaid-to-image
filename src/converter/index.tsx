import React from 'react';
import { createRoot } from 'react-dom/client';
import ConverterApp from './ConverterApp';
import '../styles/tailwind.css';

/**
 * 转换器页面入口文件
 * 当页面加载时，渲染ConverterApp组件到根DOM元素
 */
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <ConverterApp />
      </React.StrictMode>
    );
  } else {
    console.error('找不到root DOM元素，无法渲染转换器应用');
  }
}); 