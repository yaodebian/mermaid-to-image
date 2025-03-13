import React, { useState } from 'react';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import RenderError from '../../components/ui/RenderError';
import MermaidRenderer from '../../components/mermaid/MermaidRenderer';

interface PreviewPanelProps {
  code: string;
  onRendered: (success: boolean, svg?: SVGElement) => void;
}

/**
 * 预览面板组件
 * 显示Mermaid渲染结果和提供缩放功能
 */
const PreviewPanel: React.FC<PreviewPanelProps> = ({ code, onRendered }) => {
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  
  // 处理渲染结果
  const handleRender = (success: boolean, errorMsg?: string, svg?: SVGElement) => {
    if (success) {
      setError(null);
      onRendered(true, svg);
    } else {
      setError(errorMsg || '未知错误');
      onRendered(false);
    }
  };
  
  // 缩放控制
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setZoom(1);
  
  return (
    <div className="preview-panel h-full flex flex-col">
      <div className="preview-toolbar flex items-center justify-between mb-2">
        <div className="font-medium text-gray-700">预览</div>
        
        <div className="zoom-controls flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-1 rounded hover:bg-gray-100"
            title="缩小"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>
          
          <button
            onClick={zoomIn}
            className="p-1 rounded hover:bg-gray-100"
            title="放大"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            onClick={resetZoom}
            className="p-1 rounded hover:bg-gray-100 text-xs"
            title="重置缩放"
          >
            重置
          </button>
        </div>
      </div>
      
      <div 
        className="preview-container flex-1 border border-gray-300 rounded bg-white overflow-auto p-4 flex justify-center"
        style={{ minHeight: "200px" }}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}>
          <ErrorBoundary>
            {error ? (
              <RenderError error={error} code={code} />
            ) : (
              <MermaidRenderer code={code} onRender={handleRender} />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel; 