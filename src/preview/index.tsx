import React from 'react';
import { createRoot } from 'react-dom/client';
import MermaidPreview from '../components/MermaidPreview';
import '../styles/tailwind.css';

// 获取URL参数中的初始mermaid文本
const getInitialMermaidText = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const encodedText = urlParams.get('code');
  if (encodedText) {
    try {
      return decodeURIComponent(encodedText);
    } catch (e) {
      console.error('解码Mermaid文本失败:', e);
      return '';
    }
  }
  return '';
};

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app-container');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <div className="min-h-screen bg-gray-50">
          <div className="h-screen flex flex-col">
            <div className="flex justify-between items-center p-2 bg-white border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-800">Mermaid预览</h1>
            </div>
            <div className="flex-1 overflow-hidden">
              <MermaidPreview initialText={getInitialMermaidText()} />
            </div>
          </div>
        </div>
      </React.StrictMode>
    );
  }
}); 