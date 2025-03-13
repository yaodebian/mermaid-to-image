import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import MermaidRenderer from './MermaidRenderer';

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

// 添加更多官方示例代码
const MERMAID_EXAMPLES = {
  flowchart: `flowchart LR
    A[方形节点] --> B(圆角节点)
    B --> C{菱形节点}
    C -->|选项1| D[结果1]
    C -->|选项2| E[结果2]`,
  
  sequenceDiagram: `sequenceDiagram
    participant 浏览器
    participant 服务器
    浏览器->>服务器: GET请求
    服务器-->>浏览器: 返回HTML
    浏览器->>服务器: GET资源
    服务器-->>浏览器: 返回资源
    Note right of 浏览器: 渲染页面`,
  
  classDiagram: `classDiagram
    class Animal {
      +String name
      +move()
    }
    class Dog {
      +String breed
      +bark()
    }
    class Bird {
      +String color
      +fly()
    }
    Animal <|-- Dog
    Animal <|-- Bird`,
  
  gantt: `gantt
    title 项目计划
    dateFormat YYYY-MM-DD
    section 计划阶段
    需求分析     :a1, 2023-01-01, 7d
    设计文档     :a2, after a1, 5d
    section 开发阶段
    编码实现     :a3, after a2, 10d
    单元测试     :a4, after a3, 5d
    section 发布阶段
    部署上线     :a5, after a4, 2d`,
  
  pieChart: `pie title 用户分布
    "中国" : 45
    "美国" : 25
    "欧洲" : 20
    "其他" : 10`,
  
  erDiagram: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`
};

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
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [renderKey, setRenderKey] = useState<number>(0);
  const previewRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGElement | null>(null);
  
  // 加载示例代码
  const loadExample = (type: keyof typeof MERMAID_EXAMPLES) => {
    setMermaidText(MERMAID_EXAMPLES[type]);
    setSelectedExample(type);
    // 强制重新渲染
    setRenderKey(prev => prev + 1);
  };

  // 清空文本
  const handleClear = () => {
    setMermaidText('');
    setError(null);
  };

  // 强制重新渲染
  const handleForceRender = () => {
    setRenderKey(prev => prev + 1);
  };
  
  // 处理渲染完成事件
  const handleRenderComplete = useCallback((success: boolean, errorMsg?: string, svg?: SVGElement) => {
    setIsLoading(false);
    
    if (!success) {
      setError(errorMsg || '渲染失败');
      svgRef.current = null;
    } else {
      setError(null);
      if (svg) {
        svgRef.current = svg;
      }
    }
  }, []);

  // 下载SVG格式
  const handleDownloadSVG = () => {
    try {
      if (!svgRef.current) {
        throw new Error('未找到SVG元素');
      }
      
      // 复制SVG元素并应用缩放
      const svgCopy = svgRef.current.cloneNode(true) as SVGElement;
      
      // 应用缩放比例
      if (exportScale !== 1) {
        const originalWidth = svgRef.current.getAttribute('width') || svgRef.current.getBoundingClientRect().width.toString();
        const originalHeight = svgRef.current.getAttribute('height') || svgRef.current.getBoundingClientRect().height.toString();
        const width = parseFloat(originalWidth) * exportScale;
        const height = parseFloat(originalHeight) * exportScale;
        
        svgCopy.setAttribute('width', `${width}px`);
        svgCopy.setAttribute('height', `${height}px`);
      }
      
      // 处理xmlns属性
      if (!svgCopy.getAttribute('xmlns')) {
        svgCopy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      
      // 将SVG转换为文本
      const svgData = new XMLSerializer().serializeToString(svgCopy);
      
      // 创建Blob对象并下载
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      downloadBlob(blob, 'mermaid-diagram.svg');
    } catch (err) {
      setError((err as Error).message || '下载SVG失败');
      console.error('Download SVG error:', err);
    }
  };

  // 下载PNG格式
  const handleDownloadPNG = async () => {
    try {
      if (!svgRef.current) {
        throw new Error('未找到SVG元素');
      }
      
      // 创建一个临时的带缩放的SVG克隆
      const tempSvg = svgRef.current.cloneNode(true) as SVGElement;
      if (exportScale !== 1) {
        const originalWidth = svgRef.current.getAttribute('width') || svgRef.current.getBoundingClientRect().width.toString();
        const originalHeight = svgRef.current.getAttribute('height') || svgRef.current.getBoundingClientRect().height.toString();
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
      if (!svgRef.current) {
        throw new Error('未找到SVG元素');
      }
      
      // 创建一个临时的带缩放的SVG克隆
      const tempSvg = svgRef.current.cloneNode(true) as SVGElement;
      if (exportScale !== 1) {
        const originalWidth = svgRef.current.getAttribute('width') || svgRef.current.getBoundingClientRect().width.toString();
        const originalHeight = svgRef.current.getAttribute('height') || svgRef.current.getBoundingClientRect().height.toString();
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
        className="flex flex-row h-full" 
        style={{ 
          pointerEvents: 'auto', 
          position: 'relative',
          touchAction: 'none'
        }}
        onScroll={handleScroll}
      >
        {/* 左侧编辑器区域 */}
        <div className="w-1/2 pr-2">
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
                className={`text-xs px-2 py-1 rounded ${showHelp ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}
                onClick={() => setShowHelp(!showHelp)}
                title="查看Mermaid帮助"
              >
                帮助
              </button>
              <button
                className={`text-xs px-2 py-1 rounded ${debugMode ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}
                onClick={() => setDebugMode(!debugMode)}
                title="开启调试模式"
              >
                调试
              </button>
            </div>
          </div>
          
          {/* 帮助信息 */}
          {showHelp && (
            <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800 overflow-auto" style={{ maxHeight: '200px' }}>
              <h3 className="font-bold mb-1">Mermaid图表语法帮助</h3>
              <p className="mb-1">Mermaid可以创建各种类型的图表，点击上方的示例按钮可以快速开始。</p>
              <ul className="list-disc pl-4 mb-1">
                <li><strong>流程图 (flowchart)</strong>: 使用 flowchart LR (左到右) 或 TD (上到下) 开始</li>
                <li><strong>时序图 (sequenceDiagram)</strong>: 使用 sequenceDiagram 开始，展示交互过程</li>
                <li><strong>类图 (classDiagram)</strong>: 使用 classDiagram 开始，展示类结构和关系</li>
                <li><strong>甘特图 (gantt)</strong>: 使用 gantt 开始，展示项目时间线</li>
                <li><strong>饼图 (pie)</strong>: 使用 pie 开始，展示数据百分比</li>
                <li><strong>实体关系图 (erDiagram)</strong>: 使用 erDiagram 开始，展示数据库关系</li>
              </ul>
              <p className="mb-1">常用语法：</p>
              <ul className="list-disc pl-4">
                <li>节点形状: [方形], (圆角), {'{'}菱形{'}'}, 等</li>
                <li>连接符: --{'>'}，-..-{'>'}（虚线），=={'>'}(粗线), -.-{'>'}(虚线)</li>
                <li>添加文字: --{'>'}|文字|</li>
              </ul>
              <p className="mt-1">
                <a 
                  href="https://mermaid.js.org/intro/syntax-reference.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  查看完整语法参考 →
                </a>
              </p>
            </div>
          )}
          
          {/* 示例选择器 */}
          <div className="mb-2 flex flex-wrap gap-1">
            <span className="text-xs text-gray-600 self-center mr-1">加载示例:</span>
            {Object.keys(MERMAID_EXAMPLES).map((type) => (
              <button
                key={type}
                className={`text-xs px-2 py-1 rounded ${
                  selectedExample === type 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
                onClick={() => loadExample(type as keyof typeof MERMAID_EXAMPLES)}
              >
                {type}
              </button>
            ))}
          </div>
          
          <textarea
            id="mermaid-input"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={mermaidText}
            onChange={(e) => setMermaidText(e.target.value)}
            placeholder="输入Mermaid语法，例如：graph TD; A-->B;"
            aria-label="Mermaid文本输入"
            style={{ 
              pointerEvents: 'auto', 
              height: showHelp ? 'calc(100vh - 380px)' : 'calc(100vh - 180px)', 
              minHeight: '200px' 
            }}
          />
        </div>

        {/* 右侧预览区域 */}
        <div className="w-1/2 pl-2">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center">
              <h3 className="text-sm font-medium text-gray-700 mr-2">预览</h3>
              <span className={`text-xs px-2 py-0.5 rounded ${
                error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {error ? '错误' : '就绪'}
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
                title="强制重新渲染"
              >
                刷新
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-1 mb-1">
            <button
              className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
              onClick={handleDownloadSVG}
              disabled={!mermaidText.trim() || !!error}
              aria-label="下载SVG"
              style={{ pointerEvents: !!error ? 'none' : 'auto' }}
            >
              SVG
            </button>
            <button
              className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
              onClick={handleDownloadPNG}
              disabled={!mermaidText.trim() || !!error}
              aria-label="下载PNG"
              style={{ pointerEvents: !!error ? 'none' : 'auto' }}
            >
              PNG
            </button>
            <button
              className="px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
              onClick={handleDownloadJPEG}
              disabled={!mermaidText.trim() || !!error}
              aria-label="下载JPEG"
              style={{ pointerEvents: !!error ? 'none' : 'auto' }}
            >
              JPEG
            </button>
          </div>
          
          <div 
            className="relative bg-white border border-gray-300 rounded-md p-3 overflow-auto"
            ref={previewRef}
            style={{ 
              height: 'calc(100vh - 150px)',
              minHeight: '300px',
              maxHeight: '80vh'
            }}
          >
            <MermaidRenderer 
              key={renderKey}
              code={mermaidText} 
              onRender={handleRenderComplete}
              debugMode={debugMode}
            />
          </div>
          
          {debugMode && (
            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
              <div>渲染状态: {error ? '错误' : '正常'}</div>
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