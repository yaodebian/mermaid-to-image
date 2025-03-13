import React, { useState, useEffect, useRef } from 'react';
// 直接定义ExportFormats类型，不需要导入
type ExportFormats = 'svg' | 'png' | 'jpeg';
import MermaidRenderer from '../components/mermaid/MermaidRenderer';

/**
 * 转换器应用组件
 * 将Mermaid代码转换为各种图片格式
 */
const ConverterApp: React.FC = () => {
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormats>('svg');
  const [exportScale, setExportScale] = useState<number>(1);
  const [showTemplates, setShowTemplates] = useState<boolean>(false);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const initialCodeRef = useRef<string>('');
  const svgRef = useRef<SVGElement | null>(null);
  const renderingLockRef = useRef<boolean>(false); // 添加渲染锁，防止重复渲染

  // 1. 初始化及检查URL参数
  useEffect(() => {
    // 检查URL是否包含初始代码
    const urlParams = new URLSearchParams(window.location.search);
    const codeParam = urlParams.get('code');
    if (codeParam) {
      try {
        const decodedCode = decodeURIComponent(codeParam);
        setMermaidCode(decodedCode);
        initialCodeRef.current = decodedCode;
      } catch (err) {
        console.error('解析URL参数失败:', err);
      }
    } else {
      // 无代码参数时，使用默认示例
      setMermaidCode(`graph TD
    A[开始] --> B{是否已安装?}
    B -->|是| C[打开应用]
    B -->|否| D[去商店安装]
    C --> E[使用应用]
    D --> E
    E --> F[结束]`);
    }

    // 监听消息，以便从侧边栏或其他组件接收代码
    const messageListener = (message: any) => {
      if (message.type === 'SET_MERMAID_CODE' && message.code) {
        setMermaidCode(message.code);
        requestRenderPreview(message.code);
      }
    };
    
    chrome.runtime.onMessage.addListener(messageListener);
    
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  // 2. 代码变化时更新预览
  useEffect(() => {
    if (mermaidCode) {
      // 代码变化时，立即清除错误状态和锁定，允许重新渲染
      setError(null);
      renderingLockRef.current = false;
      
      const delayRender = setTimeout(() => {
        requestRenderPreview(mermaidCode);
      }, 500);
      
      return () => clearTimeout(delayRender);
    }
  }, [mermaidCode]);

  // 包装渲染函数，添加防重复渲染逻辑
  const requestRenderPreview = (code: string) => {
    // 如果渲染锁存在，则不触发新的渲染
    if (renderingLockRef.current) {
      return;
    }
    renderPreview(code);
  };
  
  // 3. 预览渲染函数
  const renderPreview = async (code: string) => {
    if (!code.trim()) {
      setPreviewSrc('');
      setError(null);
      return;
    }
    
    // 设置渲染锁，避免重复渲染
    renderingLockRef.current = true;
  };
  
  // 处理渲染结果回调
  const handleRenderComplete = (success: boolean, errorMsg?: string, svg?: SVGElement) => {
    // 延迟释放渲染锁，防止立即触发新的渲染
    setTimeout(() => {
      renderingLockRef.current = false;
    }, 100);
    
    if (!success) {
      console.error('渲染失败:', errorMsg);
      setError(errorMsg || '渲染失败');
      setPreviewSrc('');
      svgRef.current = null;
    } else {
      setError(null);
      
      if (svg) {
        // 保存SVG引用用于导出
        svgRef.current = svg;
      }
    }
  };
  
  // 4. 导出函数
  const handleExport = async () => {
    if (!mermaidCode.trim()) {
      setError('没有可导出的内容');
      return;
    }
    
    if (!svgRef.current) {
      setError('SVG元素未准备好，请等待渲染完成');
      return;
    }
    
    try {
      let downloadUrl = '';
      let filename = `mermaid-diagram-${Date.now()}`;
      
      if (exportFormat === 'svg') {
        // 使用引用的SVG导出
        const svgString = new XMLSerializer().serializeToString(svgRef.current);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        downloadUrl = URL.createObjectURL(blob);
        filename += '.svg';
        
        // 创建下载链接并触发
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.click();
        
        // 清理资源
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
      } else {
        // 使用引用的SVG转换为PNG/JPEG
        // 首先，需要将SVG转换为Data URL以便图像加载
        const svgString = new XMLSerializer().serializeToString(svgRef.current);
        const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
        const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
        
        // 创建一个临时Canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('无法创建canvas上下文');
        }
        
        // 创建Image对象从SVG加载
        const image = new Image();
        image.src = svgDataUrl;
        
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        });
        
        // 应用缩放因子
        const actualWidth = Math.max(image.naturalWidth, svgRef.current.clientWidth) * exportScale;
        const actualHeight = Math.max(image.naturalHeight, svgRef.current.clientHeight) * exportScale;
        
        canvas.width = actualWidth;
        canvas.height = actualHeight;
        
        // 如果是JPEG，先填充白色背景
        if (exportFormat === 'jpeg') {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // 绘制图像时进行缩放
        ctx.drawImage(image, 0, 0, actualWidth, actualHeight);
        
        // 转换为Blob并下载
        const mimeType = `image/${exportFormat}`;
        const quality = exportFormat === 'jpeg' ? 0.9 : undefined;
        
        canvas.toBlob((blob) => {
          if (blob) {
            downloadUrl = URL.createObjectURL(blob);
            filename += `.${exportFormat}`;
            
            // 创建下载链接并触发
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            link.click();
            
            // 清理资源
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
          } else {
            setError(`转换为${exportFormat.toUpperCase()}失败`);
          }
        }, mimeType, quality);
      }
    } catch (err) {
      console.error('导出失败:', err);
      setError('导出失败: ' + (err instanceof Error ? err.message : String(err)));
    }
  };
  
  // 缩放改变时不触发重新渲染
  useEffect(() => {
    // 空函数，仅用于捕获exportScale变化，避免触发预览重新渲染
  }, [exportScale]);
  
  // 5. 模板列表
  const templates = [
    {
      name: '流程图',
      code: `graph TD
    A[开始] --> B{判断条件}
    B -->|条件1| C[处理1]
    B -->|条件2| D[处理2]
    C --> E[结束]
    D --> E`
    },
    {
      name: '时序图',
      code: `sequenceDiagram
    participant 用户
    participant 系统
    participant 数据库
    用户->>系统: 登录请求
    系统->>数据库: 验证凭据
    数据库-->>系统: 验证结果
    系统-->>用户: 登录响应`
    },
    {
      name: '类图',
      code: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +fetch()
    }
    class Cat {
        +scratch()
    }
    Animal <|-- Dog
    Animal <|-- Cat`
    },
    {
      name: '甘特图',
      code: `gantt
    title 项目进度
    dateFormat  YYYY-MM-DD
    section 规划
    需求分析    :a1, 2023-01-01, 7d
    架构设计    :a2, after a1, 5d
    section 开发
    编码        :a3, after a2, 10d
    测试        :a4, after a3, 5d
    section 发布
    部署上线    :a5, after a4, 2d`
    }
  ];
  
  // 应用模板
  const applyTemplate = (code: string) => {
    setMermaidCode(code);
    setShowTemplates(false);
  };
  
  // 重置编辑器
  const handleReset = () => {
    setMermaidCode(initialCodeRef.current || '');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col" style={{ minWidth: '1024px' }}>
      <div className="flex-grow flex flex-col">
        <header className="py-4 px-6 bg-white shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Mermaid图表转换器</h1>
          <p className="text-gray-600">将Mermaid代码转换为图片格式 (SVG, PNG, JPEG)</p>
        </header>
        
        <div className="flex-grow flex">
          {/* 左侧编辑器 - 固定50%宽度 */}
          <div className="w-1/2 flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Mermaid代码</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                >
                  模板
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  重置
                </button>
              </div>
            </div>
            
            {showTemplates && (
              <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-2 gap-2">
                {templates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => applyTemplate(template.code)}
                    className="p-2 text-left border border-gray-200 rounded bg-white hover:bg-blue-50 hover:border-blue-200"
                  >
                    <div className="text-sm font-medium">{template.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {template.code.split('\n')[0]}...
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            <div className="flex-grow p-4 bg-white">
              <textarea
                value={mermaidCode}
                onChange={(e) => setMermaidCode(e.target.value)}
                className="w-full h-full p-3 border border-gray-300 rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入Mermaid语法..."
              />
            </div>
          </div>
          
          {/* 右侧预览及导出 - 固定50%宽度 */}
          <div className="w-1/2 flex flex-col border-l border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">图表预览</h2>
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setExportScale(prev => Math.max(prev - 0.5, 0.5))}
                    className={`p-1 rounded ${error ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    title="缩小"
                    disabled={!!error}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  
                  <span className="text-sm text-gray-600">{Math.round(exportScale * 100)}%</span>
                  
                  <button
                    onClick={() => setExportScale(prev => Math.min(prev + 0.5, 5))}
                    className={`p-1 rounded ${error ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    title="放大"
                    disabled={!!error}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => setExportScale(1)}
                    className={`p-1 rounded text-xs ${error ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    title="重置缩放"
                    disabled={!!error}
                  >
                    重置
                  </button>
                  
                  <button 
                    onClick={() => setShowDebug(!showDebug)}
                    className={`ml-2 p-1 rounded text-xs ${showDebug ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                    title="调试模式"
                  >
                    调试
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-grow p-4 bg-gray-50 flex items-center justify-center overflow-auto" ref={previewRef}>
              {error ? (
                <div className="text-center p-6 max-w-md">
                  <div className="text-red-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-red-800">渲染错误</h3>
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                </div>
              ) : mermaidCode ? (
                <div className="w-full h-full flex items-center justify-center">
                  {/* 将缩放直接应用到MermaidRenderer的父容器，不再使用图片预览 */}
                  <div style={{ transform: `scale(${exportScale})`, transformOrigin: 'center', transition: 'transform 0.2s' }} className="flex items-center justify-center">
                    <MermaidRenderer 
                      code={mermaidCode}
                      onRender={handleRenderComplete}
                      debugMode={showDebug}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  <p className="text-gray-500">输入Mermaid代码后将显示预览</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex mb-4 space-x-2">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">导出格式</label>
                  <div className="flex space-x-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio"
                        name="format"
                        value="svg"
                        checked={exportFormat === 'svg'}
                        onChange={() => setExportFormat('svg')}
                        disabled={!!error}
                      />
                      <span className="ml-1.5 text-sm">SVG</span>
                    </label>
                    
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio"
                        name="format"
                        value="png"
                        checked={exportFormat === 'png'}
                        onChange={() => setExportFormat('png')}
                        disabled={!!error}
                      />
                      <span className="ml-1.5 text-sm">PNG</span>
                    </label>
                    
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio"
                        name="format"
                        value="jpeg"
                        checked={exportFormat === 'jpeg'}
                        onChange={() => setExportFormat('jpeg')}
                        disabled={!!error}
                      />
                      <span className="ml-1.5 text-sm">JPEG</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleExport}
                disabled={!!error}
                className={`w-full py-2 rounded-md flex items-center justify-center ${
                  !!error
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出为 {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
        
        <footer className="py-4 px-6 text-center text-gray-500 text-sm bg-white border-t border-gray-200">
          <p>
            <a href="https://mermaid.js.org/syntax/flowchart.html" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              查看Mermaid语法参考
            </a>
            <span className="mx-2">•</span>
            <a href="https://github.com/yourusername/mermaid-to-image/issues" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
              报告问题
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ConverterApp; 