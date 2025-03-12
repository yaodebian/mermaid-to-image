import React, { useState, useEffect, useRef } from 'react';
import * as htmlToImage from 'html-to-image';

// 接口定义
interface MermaidData {
  id: string;
  content: string;
}

// 组件属性接口
interface MermaidExtractorProps {
  onClose?: () => void;
}

const MermaidExtractor: React.FC<MermaidExtractorProps> = ({ onClose }) => {
  const [mermaidItems, setMermaidItems] = useState<MermaidData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeLoaded = useRef<boolean>(false);

  // 初始提取图表
  useEffect(() => {
    extractMermaidFromPage();
  }, []);

  // 当选择的ID变化时，更新预览
  useEffect(() => {
    if (selectedId && iframeLoaded.current) {
      const selectedItem = mermaidItems.find(item => item.id === selectedId);
      if (selectedItem) {
        sendMermaidToIframe(selectedItem.content);
      }
    }
  }, [selectedId, mermaidItems]);

  // iframe加载完成处理
  const handleIframeLoad = () => {
    iframeLoaded.current = true;
    if (selectedId) {
      const selectedItem = mermaidItems.find(item => item.id === selectedId);
      if (selectedItem) {
        sendMermaidToIframe(selectedItem.content);
      }
    }
  };

  // 向iframe发送Mermaid文本进行渲染
  const sendMermaidToIframe = (code: string) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'render-mermaid',
        code: code
      }, '*');
    }
  };

  // 监听iframe返回的渲染结果
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'mermaid-rendered') {
        if (event.data.success) {
          setError(null);
          
          // 如果需要可以调整iframe大小
          if (iframeRef.current && event.data.width && event.data.height) {
            iframeRef.current.style.width = `${event.data.width + 20}px`;
            iframeRef.current.style.height = `${event.data.height + 20}px`;
          }
        } else {
          setError(event.data.error || '渲染失败');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 从页面提取Mermaid图表
  const extractMermaidFromPage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 向当前标签页发送消息，请求内容脚本执行提取
      const response = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = response[0];
      
      if (!currentTab?.id) {
        throw new Error('无法获取当前标签页');
      }
      
      // 注入内容脚本
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: extractMermaidContent,
      });
      
      // 监听来自内容脚本的响应
      chrome.runtime.onMessage.addListener(function listener(message) {
        if (message.type === 'mermaid-extracted') {
          // 移除监听器以避免重复
          chrome.runtime.onMessage.removeListener(listener);
          
          if (message.error) {
            setError(message.error);
            setMermaidItems([]);
          } else if (message.items && message.items.length > 0) {
            setMermaidItems(message.items);
            setSelectedId(message.items[0].id); // 默认选择第一个
          } else {
            setError('未在页面中找到任何Mermaid图表');
            setMermaidItems([]);
          }
          
          setLoading(false);
        }
      });
    } catch (err) {
      setError((err as Error).message || '提取时发生错误');
      setMermaidItems([]);
      setLoading(false);
    }
  };

  // 下载SVG格式
  const handleDownloadSVG = () => {
    try {
      if (!iframeRef.current || !iframeRef.current.contentDocument) {
        throw new Error('无法访问iframe内容');
      }
      
      const svgEl = iframeRef.current.contentDocument.querySelector('svg');
      if (!svgEl) {
        throw new Error('未找到SVG元素');
      }

      // 创建一个新的SVG并拷贝属性
      const svgClone = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      Array.from(svgEl.attributes).forEach(attr => {
        svgClone.setAttribute(attr.name, attr.value);
      });
      
      // 拷贝内容
      svgClone.innerHTML = svgEl.innerHTML;
      
      // 转换为blob
      const svgData = new XMLSerializer().serializeToString(svgClone);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      
      // 下载
      downloadBlob(blob, 'mermaid-diagram.svg');
    } catch (err) {
      setError((err as Error).message || '下载SVG失败');
      console.error('Download SVG error:', err);
    }
  };

  // 下载PNG格式
  const handleDownloadPNG = async () => {
    try {
      if (!iframeRef.current || !iframeRef.current.contentDocument) {
        throw new Error('无法访问iframe内容');
      }
      
      const svgEl = iframeRef.current.contentDocument.querySelector('svg');
      if (!svgEl) {
        throw new Error('未找到SVG元素');
      }
      
      // 使用html-to-image将SVG转换为PNG
      const dataUrl = await htmlToImage.toPng(svgEl);
      const link = document.createElement('a');
      link.download = 'mermaid-diagram.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setError((err as Error).message || '下载PNG失败');
      console.error('Download PNG error:', err);
    }
  };

  // 下载JPEG格式
  const handleDownloadJPEG = async () => {
    try {
      if (!iframeRef.current || !iframeRef.current.contentDocument) {
        throw new Error('无法访问iframe内容');
      }
      
      const svgEl = iframeRef.current.contentDocument.querySelector('svg');
      if (!svgEl) {
        throw new Error('未找到SVG元素');
      }
      
      // 使用html-to-image将SVG转换为JPEG
      const dataUrl = await htmlToImage.toJpeg(svgEl, { quality: 0.95 });
      const link = document.createElement('a');
      link.download = 'mermaid-diagram.jpeg';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      setError((err as Error).message || '下载JPEG失败');
      console.error('Download JPEG error:', err);
    }
  };

  // 通用下载blob函数
  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">
          从页面提取的Mermaid图表 ({mermaidItems.length})
        </h3>
        <button
          className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
          onClick={extractMermaidFromPage}
          disabled={loading}
          aria-label="刷新图表列表"
        >
          刷新
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && mermaidItems.length === 0 && (
        <div className="text-center p-4 text-gray-500">
          {error || '未发现任何Mermaid图表。请确保页面上存在Mermaid图表并点击刷新。'}
        </div>
      )}

      {!loading && mermaidItems.length > 0 && (
        <>
          <div className="mb-4 max-h-[150px] overflow-y-auto border border-gray-200 rounded">
            <ul className="divide-y divide-gray-200">
              {mermaidItems.map((item) => (
                <li 
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`cursor-pointer p-2 hover:bg-gray-50 ${selectedId === item.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="text-xs font-mono truncate">{item.content.substring(0, 50)}...</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">预览</h3>
              <div className="flex space-x-2">
                <button
                  className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                  onClick={handleDownloadSVG}
                  disabled={!selectedId || !!error}
                  aria-label="下载SVG"
                >
                  SVG
                </button>
                <button
                  className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                  onClick={handleDownloadPNG}
                  disabled={!selectedId || !!error}
                  aria-label="下载PNG"
                >
                  PNG
                </button>
                <button
                  className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
                  onClick={handleDownloadJPEG}
                  disabled={!selectedId || !!error}
                  aria-label="下载JPEG"
                >
                  JPEG
                </button>
              </div>
            </div>
            
            <div 
              ref={previewRef} 
              className="min-h-[200px] border border-gray-200 rounded flex items-center justify-center"
            >
              {!selectedId ? (
                <p className="text-gray-400 text-center">请从上方列表选择一个图表查看预览</p>
              ) : (
                <iframe
                  ref={iframeRef}
                  src="mermaid-renderer.html"
                  className="border-0 w-full h-full min-h-[200px]"
                  sandbox="allow-scripts allow-same-origin"
                  onLoad={handleIframeLoad}
                  title="Mermaid渲染"
                />
              )}
            </div>
            
            {error && (
              <div className="mt-2 text-sm text-red-600">{error}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// 在网页中执行的提取函数
function extractMermaidContent() {
  try {
    const results: { id: string; content: string }[] = [];
    
    // 查找多种可能的mermaid容器
    const selectors = [
      // 常见的mermaid类或标记
      '.mermaid', 
      '[data-mermaid]',
      '[data-diagram-source]',
      'pre.language-mermaid',
      // GitHub风格的代码块
      'pre[lang="mermaid"]',
      // 通用代码块中可能的mermaid
      'pre code.language-mermaid',
      'code.language-mermaid',
      'pre.mermaid-pre',
      // Markdown预览中的容器
      '.markdown-body .mermaid',
      '.markdown-preview .mermaid',
      // 自定义容器
      '[data-type="mermaid"]',
      '.mermaid-diagram'
    ];
    
    // 尝试每个选择器
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach((el, index) => {
        let content = '';
        
        // 尝试不同的方式获取内容
        if (el.getAttribute('data-content')) {
          // 有些实现将原始文本存储在data-content属性中
          content = el.getAttribute('data-content') || '';
        } else if (el.getAttribute('data-diagram-source')) {
          // 有些实现使用data-diagram-source
          content = el.getAttribute('data-diagram-source') || '';
        } else if (el.tagName.toLowerCase() === 'pre' || el.tagName.toLowerCase() === 'code') {
          // 简单的pre或code元素，取其文本内容
          content = el.textContent || '';
        } else {
          // 普通容器，在渲染前通常包含原始文本
          content = el.textContent || '';
          
          // 如果内容为空或包含HTML（可能已渲染），尝试查找data-原始属性
          if (!content.trim() || content.includes('<svg')) {
            // 一些mermaid实现将原始文本存储在属性中
            const originalContent = el.getAttribute('data-original') || 
                                   el.getAttribute('data-source') || 
                                   el.getAttribute('data-mermaid');
            
            if (originalContent) {
              content = originalContent;
            }
          }
        }
        
        // 清理内容并验证
        content = content.trim();
        
        // 如果提取到了内容，且看起来像是mermaid语法，则添加到结果
        if (content && (
            content.startsWith('graph ') || 
            content.startsWith('flowchart ') || 
            content.startsWith('sequenceDiagram') || 
            content.startsWith('classDiagram') || 
            content.startsWith('stateDiagram') || 
            content.startsWith('gantt') ||
            content.startsWith('pie') ||
            content.startsWith('erDiagram')
          )) {
          results.push({
            id: `mermaid-${selector.replace(/[^\w]/g, '')}-${index}`,
            content: content
          });
        }
      });
    });
    
    // 向扩展发送结果
    chrome.runtime.sendMessage({
      type: 'mermaid-extracted',
      items: results,
      error: results.length === 0 ? '未在页面中找到任何Mermaid图表' : null
    });
  } catch (error) {
    // 发送错误
    chrome.runtime.sendMessage({
      type: 'mermaid-extracted',
      items: [],
      error: `提取过程中出错: ${(error as Error).message || '未知错误'}`
    });
  }
}

export default MermaidExtractor; 