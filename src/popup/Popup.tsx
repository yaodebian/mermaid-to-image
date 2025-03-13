import React, { useState } from 'react';

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'preview' | 'extract'>('preview');

  const handlePreviewClick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) {
        console.error('无法获取当前标签页ID');
        return;
      }
      
      try {
        // 发送消息并监听响应
        chrome.tabs.sendMessage(
          tabs[0].id, 
          { action: 'openPreview' },
          (response) => {
            // 检查响应是否成功
            if (chrome.runtime.lastError) {
              console.error('发送消息时出错:', chrome.runtime.lastError);
              // 可能内容脚本未注入，尝试注入内容脚本
              // 这里可以添加额外的错误处理逻辑
            } else if (!response?.success) {
              console.error('预览打开失败:', response?.error || '未知错误');
            } else {
              console.log('预览已打开');
            }
            
            // 无论如何都关闭弹出窗口
            window.close();
          }
        );
      } catch (error) {
        console.error('发送openPreview消息时出错:', error);
        window.close();
      }
    });
  };

  const handleExtractClick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]?.id) {
        console.error('无法获取当前标签页ID');
        return;
      }
      
      try {
        // 发送消息并监听响应
        chrome.tabs.sendMessage(
          tabs[0].id, 
          { action: 'extractMermaid' },
          (response) => {
            // 检查响应是否成功
            if (chrome.runtime.lastError) {
              console.error('发送消息时出错:', chrome.runtime.lastError);
              // 可能内容脚本未注入，尝试注入内容脚本
            } else if (!response?.success) {
              console.error('提取打开失败:', response?.error || '未知错误');
            } else {
              console.log('提取已打开');
            }
            
            // 无论如何都关闭弹出窗口
            window.close();
          }
        );
      } catch (error) {
        console.error('发送extractMermaid消息时出错:', error);
        window.close();
      }
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
          <p className="text-sm mb-4">在新窗口中打开Mermaid预览编辑器并可下载图像</p>
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
        提示：选中页面中的Mermaid代码后再点击预览按钮可自动填充
      </div>
    </div>
  );
};

export default Popup; 