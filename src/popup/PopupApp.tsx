import React from 'react';

/**
 * 弹出窗口应用组件
 * 提供快速访问扩展功能的入口
 */
const PopupApp: React.FC = () => {
  // 打开Mermaid提取器侧边栏
  const handleOpenSidebar = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.runtime.sendMessage({ action: 'openSidebar' }, (response) => {
          if (response?.success) {
            console.log('已请求打开侧边栏');
            window.close(); // 关闭弹出窗口
          } else {
            console.error('打开侧边栏失败:', response?.error);
          }
        });
      }
    });
  };
  
  // 打开Mermaid转图片工具
  const handleOpenConverter = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('converter.html') }, () => {
      window.close(); // 关闭弹出窗口
    });
  };
  
  return (
    <div className="popup-app py-2">
      <h1 className="px-4 text-lg font-bold text-gray-800 mb-3">
        Mermaid图表提取器
      </h1>
      
      <ul className="menu">
        <li className="menu-item">
          <button 
            onClick={handleOpenSidebar}
            className="flex items-center w-full px-4 py-2 hover:bg-blue-50 text-left"
          >
            <svg className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            提取页面Mermaid图表
          </button>
        </li>
        
        <li className="menu-item">
          <button 
            onClick={handleOpenConverter}
            className="flex items-center w-full px-4 py-2 hover:bg-blue-50 text-left"
          >
            <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Mermaid转图片工具
          </button>
        </li>
      </ul>
      
      <div className="px-4 mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <a 
          href="https://mermaid.js.org/syntax/flowchart.html"
          target="_blank"
          rel="noopener noreferrer"
          className="block py-1 hover:text-blue-500"
        >
          Mermaid语法参考
        </a>
        <a 
          href="https://github.com/user/mermaid-to-image/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="block py-1 hover:text-blue-500"
        >
          报告问题
        </a>
      </div>
    </div>
  );
};

export default PopupApp; 