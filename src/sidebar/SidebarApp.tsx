import React, { useState, useEffect } from 'react';
import { MermaidChart } from '../types';
import { DiagramDetectionService } from '../services/DiagramDetectionService';

/**
 * 侧边栏应用组件
 * 负责显示从当前页面检测到的Mermaid图表
 */
const SidebarApp: React.FC = () => {
  const [detectedCharts, setDetectedCharts] = useState<MermaidChart[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChartIndex, setActiveChartIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 从当前页面检测图表
        const charts = await DiagramDetectionService.detectChartsFromCurrentPage();
        setDetectedCharts(charts);
        
        if (charts.length > 0) {
          setActiveChartIndex(0);
        }
      } catch (err) {
        setError('检测图表时出错: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharts();
    
    // 设置消息监听器，响应页面上图表变化
    const messageListener = (message: any) => {
      if (message.type === 'MERMAID_CHARTS_UPDATED') {
        fetchCharts();
      }
    };
    
    chrome.runtime.onMessage.addListener(messageListener);
    
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        // 显示复制成功的提示
        const tempElement = document.createElement('div');
        tempElement.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg';
        tempElement.textContent = '已复制到剪贴板';
        document.body.appendChild(tempElement);
        
        setTimeout(() => {
          document.body.removeChild(tempElement);
        }, 2000);
      })
      .catch(err => {
        setError('复制到剪贴板失败: ' + err.message);
      });
  };

  const handleExportChart = (chartId: string) => {
    chrome.runtime.sendMessage({
      type: 'OPEN_DIAGRAM_PREVIEW',
      chartId: chartId
    });
  };

  const handleOpenConverter = (code: string) => {
    chrome.runtime.sendMessage({
      type: 'OPEN_CONVERTER',
      code: code
    });
  };

  return (
    <div className="flex flex-col h-full p-4 bg-gray-50 text-gray-900">
      <header className="pb-4 border-b border-gray-200">
        <h1 className="text-xl font-bold">Mermaid图表提取器</h1>
        <p className="text-sm text-gray-600">从当前页面提取Mermaid图表代码</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center flex-grow p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 mt-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p>{error}</p>
        </div>
      ) : detectedCharts.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-grow p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-gray-600">当前页面未检测到Mermaid图表</p>
          <p className="text-sm text-gray-500 mt-2">提示: 确保页面上包含了Mermaid图表</p>
        </div>
      ) : (
        <div className="flex flex-col flex-grow mt-4 overflow-hidden">
          <div className="flex mb-2 space-x-1 overflow-x-auto">
            {detectedCharts.map((chart, index) => (
              <button
                key={chart.id}
                className={`px-3 py-1 text-sm rounded-t-lg ${
                  index === activeChartIndex 
                    ? 'bg-white border border-gray-200 border-b-white text-blue-600' 
                    : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => setActiveChartIndex(index)}
              >
                图表 {index + 1}
              </button>
            ))}
          </div>

          {activeChartIndex >= 0 && (
            <div className="flex flex-col flex-grow border border-gray-200 rounded-lg bg-white overflow-hidden">
              <div className="p-4 overflow-auto flex-grow">
                <pre className="text-sm bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                  <code>{detectedCharts[activeChartIndex].code}</code>
                </pre>
              </div>
              
              <div className="flex p-3 bg-gray-50 border-t border-gray-200">
                <button
                  className="flex items-center mr-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => handleCopyCode(detectedCharts[activeChartIndex].code)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  复制代码
                </button>
                
                <button
                  className="flex items-center mr-2 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={() => handleOpenConverter(detectedCharts[activeChartIndex].code)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  转为图片
                </button>
                
                <button
                  className="flex items-center px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                  onClick={() => handleExportChart(detectedCharts[activeChartIndex].id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  预览
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarApp; 