import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';

// 全局初始化Mermaid不再需要，改为使用沙盒中的Mermaid
// try {
//   // 初始化Mermaid，使用通用配置适用于所有图表类型
//   mermaid.initialize({...});
//   console.log('全局Mermaid初始化成功');
// } catch (error) {
//   console.error('全局Mermaid初始化失败:', error);
// }

// 移除旧的renderMermaidDiagram函数，我们将使用iframe通信来替代

interface MermaidPreviewProps {
  initialText?: string;
}

// 保留错误边界组件
class ErrorBoundary extends React.Component<{children: React.ReactNode, fallback?: React.ReactNode}> {
  state = { hasError: false, error: null as Error | null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("MermaidPreview错误:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded">
          <h3 className="font-bold mb-2">组件渲染错误</h3>
          <p>{this.state.error?.toString() || '未知错误'}</p>
          <button 
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            重试
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

const DEFAULT_MERMAID_TEXT = `graph TD
    A[开始] --> B[流程步骤]
    B --> C{判断条件}
    C -->|是| D[执行步骤1]
    C -->|否| E[执行步骤2]
    D --> F[结束]
    E --> F`;

// 错误组件
const RenderError: React.FC<{error: string, code?: string}> = ({ error, code }) => {
  // 尝试提取错误行和字符位置
  let errorLine = 'Unknown';
  let errorChar = '';
  
  const lineMatch = error.match(/Line (\d+)/i);
  if (lineMatch) {
    errorLine = lineMatch[1];
  }
  
  const charMatch = error.match(/character (\d+)/i);
  if (charMatch) {
    errorChar = `，字符 ${charMatch[1]}`;
  }
  
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
      <div className="font-bold mb-1">Mermaid语法错误</div>
      <div>错误位置: 第 {errorLine} 行{errorChar}</div>
      <div>错误信息: {error}</div>
      
      {code && errorLine !== 'Unknown' && (
        <div className="mt-2 p-2 bg-white border border-red-100 rounded font-mono text-xs whitespace-pre-wrap">
          {code.split('\n').map((line, i) => {
            const lineNum = i + 1;
            const isErrorLine = lineNum === parseInt(errorLine);
            return (
              <div 
                key={i} 
                className={`${isErrorLine ? 'bg-red-50 font-semibold' : ''}`}
              >
                {lineNum}: {line}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MermaidPreview: React.FC<MermaidPreviewProps> = ({ initialText = '' }) => {
  const [mermaidText, setMermaidText] = useState(initialText || DEFAULT_MERMAID_TEXT);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportScale, setExportScale] = useState(1);
  const [debugMode, setDebugMode] = useState(false);
  const [rendererStatus, setRendererStatus] = useState<'未初始化' | '加载中' | '就绪' | '错误'>('未初始化');
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const svgRef = useRef<SVGElement | null>(null);
  const isIframeLoaded = useRef<boolean>(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [svgDimensions, setSvgDimensions] = useState<{width: number, height: number} | null>(null);
  
  // 使用绝对路径加载iframe
  const getRendererUrl = (): string => {
    // 尝试使用chrome-extension://协议，确保路径正确
    try {
      // 此处路径指向webpack生成的mermaid-renderer.html
      return chrome.runtime.getURL("mermaid-renderer.html");
    } catch (e) {
      console.error("无法获取chrome.runtime.getURL", e);
      // 回退到相对路径
      return "./mermaid-renderer.html";
    }
  };

  // 开启调试模式
  const toggleDebugMode = () => {
    const newDebugMode = !debugMode;
    setDebugMode(newDebugMode);
    
    // 如果iframe已加载，通知iframe更新调试模式
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'debug-mode',
        enabled: newDebugMode
      }, '*');
    }
  };

  // 处理iframe加载完成事件
  const handleIframeLoad = useCallback(() => {
    console.log('iframe已加载');
    isIframeLoaded.current = true;
    setRendererStatus('加载中');
    
    // 仅在iframe刚加载完时启用调试模式
    if (debugMode && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'debug-mode',
        enabled: true
      }, '*');
    }
    
    // 设置安全超时，如果长时间没有收到渲染完成消息，自动关闭加载状态
    setTimeout(() => {
      // 如果还处于加载状态，认为是渲染卡住了
      if (isLoading) {
        console.log('渲染超时，自动关闭加载状态');
        setIsLoading(false);
      }
    }, 5000); // 5秒超时
  }, [debugMode, isLoading]);

  // 监听来自iframe的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      
      console.log('收到iframe消息:', event.data.type);
      
      if (event.data.type === 'mermaid-rendered') {
        setIsLoading(false);
        
        if (event.data.success) {
          setError(null);
          
          // 保存SVG尺寸信息用于自适应高度
          if (event.data.width && event.data.height) {
            setSvgDimensions({
              width: event.data.width,
              height: event.data.height
            });
          }
          
          // 通过iframe的contentDocument获取SVG元素
          if (iframeRef.current && iframeRef.current.contentDocument) {
            const svgEl = iframeRef.current.contentDocument.querySelector('svg');
            if (svgEl) {
              svgRef.current = svgEl;
              // 确保SVG元素是可见的，消除空白渲染问题
              svgEl.style.display = 'block';
              svgEl.style.margin = '0 auto';
            } else {
              console.error('收到渲染成功消息但未找到SVG元素');
            }
          }
        } else {
          setError(event.data.error || '渲染失败');
        }
      } else if (event.data.type === 'mermaid-ready') {
        console.log('Mermaid沙盒已准备就绪', event.data);
        if (event.data.success) {
          // 沙盒中的Mermaid已初始化完成，可以发送渲染请求
          setRendererStatus('就绪');
          if (mermaidText.trim()) {
            renderMermaid(mermaidText);
          }
        } else {
          setRendererStatus('错误');
          setError(event.data.error || 'Mermaid初始化失败');
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 清空编辑框
  const handleClear = () => {
    setMermaidText('');
    setError(null);
  };

  // 防抖函数：等待用户停止输入一段时间后再渲染
  const debouncedRender = useCallback((text: string) => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    
    // 如果没有文本，清空渲染区域
    if (!text.trim()) {
      setError(null);
      return;
    }
    
    // 延迟300ms再渲染，减少频繁渲染
    renderTimeoutRef.current = setTimeout(() => {
      console.log('执行延迟渲染', text.substring(0, 20) + '...');
      renderMermaid(text);
    }, 300);
  }, []);

  // 通过iframe渲染Mermaid图表
  const renderMermaid = useCallback((code: string) => {
    if (!code.trim()) return;
    
    if (!iframeRef.current || !iframeRef.current.contentWindow) {
      console.error('iframe未加载，无法渲染');
      setError('渲染器未准备好，请刷新后重试');
      return;
    }
    
    setIsLoading(true);
    console.log('发送Mermaid代码到iframe', code.length + '字符');
    
    // 设置渲染超时保护
    const renderTimeout = setTimeout(() => {
      console.warn('渲染操作超时');
      setIsLoading(false);
    }, 10000); // 10秒后如果没有响应，自动关闭加载状态
    
    // 向iframe发送消息，请求渲染Mermaid
    iframeRef.current.contentWindow.postMessage({
      type: 'render-mermaid',
      code: code,
      requestId: Date.now() // 添加请求ID便于调试
    }, '*');
    
    // 清除之前的超时
    return () => clearTimeout(renderTimeout);
  }, []);

  // 强制重新渲染当前图表
  const handleForceRender = () => {
    if (mermaidText.trim()) {
      renderMermaid(mermaidText);
    }
  };

  // 当文本改变时渲染新的Mermaid文本
  useEffect(() => {
    console.log('文本变化', { length: mermaidText.length, status: rendererStatus, loaded: isIframeLoaded.current });
    
    // 即使状态不是就绪，也尝试渲染，因为iframe可能已经准备好但没有通知
    if (isIframeLoaded.current) {
      // 如果状态不是就绪，也允许渲染，只要iframe已加载
      debouncedRender(mermaidText);
    }
  }, [mermaidText, debouncedRender]);

  // 额外添加一个useEffect以便在iframe加载完成后立即渲染当前文本
  useEffect(() => {
    if (isIframeLoaded.current && mermaidText.trim()) {
      console.log('iframe已加载，立即渲染当前文本');
      renderMermaid(mermaidText);
    }
  }, [isIframeLoaded.current]); // 依赖于isIframeLoaded.current的变化

  // 清理副作用
  useEffect(() => {
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);

  // 下载SVG格式
  const handleDownloadSVG = () => {
    try {
      if (!iframeRef.current || !iframeRef.current.contentDocument) {
        throw new Error('未找到iframe或SVG元素');
      }
      
      // 从iframe中获取SVG元素
      const svgElement = iframeRef.current.contentDocument.querySelector('svg');
      if (!svgElement) {
        throw new Error('未找到SVG元素');
      }

      // 创建一个新的SVG并拷贝属性
      const svgClone = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      Array.from(svgElement.attributes).forEach(attr => {
        svgClone.setAttribute(attr.name, attr.value);
      });
      
      // 设置缩放比例
      if (exportScale !== 1) {
        const originalWidth = svgElement.getAttribute('width') || svgElement.getBoundingClientRect().width.toString();
        const originalHeight = svgElement.getAttribute('height') || svgElement.getBoundingClientRect().height.toString();
        const width = parseFloat(originalWidth) * exportScale;
        const height = parseFloat(originalHeight) * exportScale;
        
        svgClone.setAttribute('width', `${width}`);
        svgClone.setAttribute('height', `${height}`);
        svgClone.setAttribute('viewBox', svgElement.getAttribute('viewBox') || `0 0 ${originalWidth} ${originalHeight}`);
      }
      
      // 拷贝内容
      svgClone.innerHTML = svgElement.innerHTML;
      
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
        throw new Error('未找到iframe或SVG元素');
      }
      
      // 从iframe中获取SVG元素
      const svgElement = iframeRef.current.contentDocument.querySelector('svg');
      if (!svgElement) {
        throw new Error('未找到SVG元素');
      }
      
      // 创建一个临时的带缩放的SVG克隆
      const tempSvg = svgElement.cloneNode(true) as SVGElement;
      if (exportScale !== 1) {
        const originalWidth = svgElement.getAttribute('width') || svgElement.getBoundingClientRect().width.toString();
        const originalHeight = svgElement.getAttribute('height') || svgElement.getBoundingClientRect().height.toString();
        const width = parseFloat(originalWidth) * exportScale;
        const height = parseFloat(originalHeight) * exportScale;
        
        tempSvg.setAttribute('width', `${width}px`);
        tempSvg.setAttribute('height', `${height}px`);
      }
      
      // 使用html-to-image将SVG转换为PNG
      const dataUrl = await htmlToImage.toPng(tempSvg, {
        pixelRatio: exportScale
      });
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
        throw new Error('未找到iframe或SVG元素');
      }
      
      // 从iframe中获取SVG元素
      const svgElement = iframeRef.current.contentDocument.querySelector('svg');
      if (!svgElement) {
        throw new Error('未找到SVG元素');
      }
      
      // 创建一个临时的带缩放的SVG克隆
      const tempSvg = svgElement.cloneNode(true) as SVGElement;
      if (exportScale !== 1) {
        const originalWidth = svgElement.getAttribute('width') || svgElement.getBoundingClientRect().width.toString();
        const originalHeight = svgElement.getAttribute('height') || svgElement.getBoundingClientRect().height.toString();
        const width = parseFloat(originalWidth) * exportScale;
        const height = parseFloat(originalHeight) * exportScale;
        
        tempSvg.setAttribute('width', `${width}px`);
        tempSvg.setAttribute('height', `${height}px`);
      }
      
      // 使用html-to-image将SVG转换为JPEG
      const dataUrl = await htmlToImage.toJpeg(tempSvg, {
        quality: 0.95,
        pixelRatio: exportScale
      });
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

  // 阻止滚动事件传播
  const handleScroll = (e: React.UIEvent) => {
    e.stopPropagation();
  };

  return (
    <ErrorBoundary>
      <div 
        className="flex flex-col h-full" 
        style={{ 
          pointerEvents: 'auto', 
          position: 'relative',
          touchAction: 'none'
        }}
        onScroll={handleScroll}
      >
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <label 
              htmlFor="mermaid-input" 
              className="block text-sm font-medium text-gray-700"
            >
              Mermaid文本
            </label>
            <div className="flex space-x-2">
              <button
                className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                onClick={handleClear}
                title="清空编辑框"
              >
                清空
              </button>
              <button
                className={`text-xs px-2 py-1 rounded ${debugMode ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}
                onClick={toggleDebugMode}
                title="开启调试模式"
              >
                调试
              </button>
            </div>
          </div>
          <textarea
            id="mermaid-input"
            className="w-full p-2 border border-gray-300 rounded-md min-h-[120px]"
            value={mermaidText}
            onChange={(e) => setMermaidText(e.target.value)}
            placeholder="输入Mermaid语法，例如：graph TD; A-->B;"
            aria-label="Mermaid文本输入"
            style={{ pointerEvents: 'auto' }}
          />
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <h3 className="text-sm font-medium text-gray-700 mr-2">预览</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${
                rendererStatus === '就绪' ? 'bg-green-100 text-green-800' : 
                rendererStatus === '错误' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {rendererStatus}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <span className="text-xs text-gray-600 mr-1">缩放:</span>
                <select 
                  value={exportScale} 
                  onChange={(e) => setExportScale(parseFloat(e.target.value))}
                  className="text-xs border border-gray-300 rounded px-1 py-0.5"
                  style={{ pointerEvents: 'auto' }}
                >
                  <option value="0.5">0.5x</option>
                  <option value="1">1x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                </select>
              </div>
              <button
                className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={handleForceRender}
                disabled={!mermaidText.trim() || isLoading}
                title="强制重新渲染"
              >
                刷新
              </button>
              <button
                className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
                onClick={handleDownloadSVG}
                disabled={!mermaidText.trim() || !!error || isLoading}
                aria-label="下载SVG"
                style={{ pointerEvents: !!error ? 'none' : 'auto' }}
              >
                SVG
              </button>
              <button
                className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
                onClick={handleDownloadPNG}
                disabled={!mermaidText.trim() || !!error || isLoading}
                aria-label="下载PNG"
                style={{ pointerEvents: !!error ? 'none' : 'auto' }}
              >
                PNG
              </button>
              <button
                className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
                onClick={handleDownloadJPEG}
                disabled={!mermaidText.trim() || !!error || isLoading}
                aria-label="下载JPEG"
                style={{ pointerEvents: !!error ? 'none' : 'auto' }}
              >
                JPEG
              </button>
            </div>
          </div>
          
          <div className="flex-1 relative mt-2">
            <div 
              className="bg-white border border-gray-300 rounded-md p-3 overflow-auto"
              ref={previewRef}
              style={{ 
                minHeight: '250px',
                maxHeight: '600px' // 添加最大高度限制
              }}
            >
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    渲染预览{rendererStatus !== '就绪' ? ` - ${rendererStatus}` : ''}
                  </span>
                  <button
                    className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
                    onClick={handleForceRender}
                    title="重新渲染"
                  >
                    刷新
                  </button>
                </div>
                
                {error && (
                  <RenderError error={error} code={mermaidText} />
                )}
                
                <iframe
                  ref={iframeRef}
                  src={getRendererUrl()}
                  style={{
                    width: '100%',
                    height: svgDimensions 
                      ? `${Math.min(svgDimensions.height + 40, 550)}px` // 根据SVG高度自适应，并设置上限
                      : isLoading || error ? '250px' : '400px', // 默认高度
                    border: 'none',
                    overflow: 'hidden',
                    transition: 'height 0.3s ease', // 平滑过渡
                    backgroundColor: '#fff'
                  }}
                  sandbox="allow-scripts allow-same-origin allow-downloads"
                  onLoad={handleIframeLoad}
                  title="Mermaid渲染器"
                />
                
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
                    <div className="text-gray-500">
                      <svg className="animate-spin h-5 w-5 mr-3 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      渲染中...
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {debugMode && (
            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
              <div>渲染器状态: {rendererStatus}</div>
              <div>已加载iframe: {isIframeLoaded.current ? '是' : '否'}</div>
              <div>正在加载: {isLoading ? '是' : '否'}</div>
              <div>SVG元素存在: {svgRef.current ? '是' : '否'}</div>
              <div>错误状态: {error ? '是' : '否'}</div>
              {error && <div>错误信息: {error}</div>}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default MermaidPreview; 