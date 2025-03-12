import React, { useState } from 'react';

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'preview' | 'extract'>('preview');

  const handlePreviewClick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id!, { action: 'openPreview' });
      window.close();
    });
  };

  const handleExtractClick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id!, { action: 'extractMermaid' });
      window.close();
    });
  };

  return (
    <div className="w-80 p-4 bg-white text-gray-800">
      <h1 className="text-xl font-bold mb-4 text-center">Mermaid to Image</h1>
      
      <div className="flex border-b border-gray-200 mb-4">
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('preview')}
        >
          预览
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeTab === 'extract' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('extract')}
        >
          提取
        </button>
      </div>

      {activeTab === 'preview' && (
        <div>
          <p className="text-sm mb-4">打开浮层预览Mermaid并下载图像</p>
          <button 
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={handlePreviewClick}
          >
            打开Mermaid预览
          </button>
        </div>
      )}

      {activeTab === 'extract' && (
        <div>
          <p className="text-sm mb-4">从当前页面提取Mermaid图表</p>
          <button 
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={handleExtractClick}
          >
            提取页面图表
          </button>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 text-center">
        双击浮层标题栏以折叠/展开
      </div>
    </div>
  );
};

export default Popup; 