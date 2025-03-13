import React, { useState, useEffect, useRef } from 'react';
import { MermaidRenderService } from '../services/MermaidRenderService';
import { ExportFormats } from '../types';

/**
 * 转换器应用组件
 * 将Mermaid代码转换为各种图片格式
 */
const ConverterApp: React.FC = () => {
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [previewSrc, setPreviewSrc] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<ExportFormats>('svg');
  const [exportScale, setExportScale] = useState<number>(1);
  const [showTemplates, setShowTemplates] = useState<boolean>(false);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const initialCodeRef = useRef<string>('');

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
        renderPreview(message.code);
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
      const delayRender = setTimeout(() => {
        renderPreview(mermaidCode);
      }, 500);
      
      return () => clearTimeout(delayRender);
    }
  }, [mermaidCode, exportScale]);
  
  // 3. 预览渲染函数
  const renderPreview = async (code: string) => {
    if (!code.trim()) {
      setPreviewSrc('');
      setError(null);
      return;
    }
    
    try {
      setIsRendering(true);
      setError(null);
      
      const svgString = await MermaidRenderService.renderToSvg(code, {
        scale: exportScale,
        backgroundColor: 'white'
      });
      
      // 转换SVG为Data URI
      const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
      const dataUri = `data:image/svg+xml;base64,${svgBase64}`;
      setPreviewSrc(dataUri);
    } catch (err) {
      console.error('渲染Mermaid图表失败:', err);
      setError('渲染失败: ' + (err instanceof Error ? err.message : String(err)));
      setPreviewSrc('');
    } finally {
      setIsRendering(false);
    }
  };
  
  // 4. 导出函数
  const handleExport = async () => {
    if (!mermaidCode.trim() || !previewSrc) {
      setError('没有可导出的内容');
      return;
    }
    
    try {
      let downloadUrl = '';
      let filename = `mermaid-diagram-${Date.now()}`;
      
      if (exportFormat === 'svg') {
        // 直接使用SVG
        const svgString = await MermaidRenderService.renderToSvg(mermaidCode, {
          scale: exportScale,
          backgroundColor: 'white'
        });
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        downloadUrl = URL.createObjectURL(blob);
        filename += '.svg';
      } else {
        // 转换为PNG/JPEG
        const image = new Image();
        image.src = previewSrc;
        
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('无法创建canvas上下文');
        }
        
        canvas.width = image.width;
        canvas.height = image.height;
        
        // 如果是JPEG，先填充白色背景
        if (exportFormat === 'jpeg') {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(image, 0, 0);
        
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
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mermaid图表转换器</h1>
          <p className="text-gray-600">将Mermaid代码转换为图片格式 (SVG, PNG, JPEG)</p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧编辑器 */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
            
            <div className="p-4">
              <textarea
                value={mermaidCode}
                onChange={(e) => setMermaidCode(e.target.value)}
                className="w-full h-80 p-3 border border-gray-300 rounded font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="输入Mermaid语法..."
              />
            </div>
          </div>
          
          {/* 右侧预览及导出 */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">图表预览</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">缩放:</span>
                  <select
                    value={exportScale}
                    onChange={(e) => setExportScale(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value={1}>1x</option>
                    <option value={2}>2x</option>
                    <option value={3}>3x</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex-grow p-4 bg-gray-50 flex items-center justify-center overflow-auto" ref={previewRef}>
              {isRendering ? (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                  <p className="text-gray-600">渲染中...</p>
                </div>
              ) : error ? (
                <div className="text-center p-6 max-w-md">
                  <div className="text-red-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-red-800">渲染错误</h3>
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                </div>
              ) : previewSrc ? (
                <img
                  src={previewSrc}
                  alt="Mermaid图表预览"
                  className="max-w-full max-h-full object-contain"
                />
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
                      />
                      <span className="ml-1.5 text-sm">JPEG</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleExport}
                disabled={!previewSrc || isRendering}
                className={`w-full py-2 rounded-md flex items-center justify-center ${
                  !previewSrc || isRendering
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
        
        <footer className="mt-8 text-center text-gray-500 text-sm">
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