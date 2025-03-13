import React, { useState } from 'react';
import MermaidRenderer from '../../components/mermaid/MermaidRenderer';

interface DiagramItemProps {
  id: string;
  sourceCode: string;
  index: number;
  onCopy: () => void;
}

/**
 * 图表项组件
 * 显示单个Mermaid图表项，包括预览和复制功能
 */
const DiagramItem: React.FC<DiagramItemProps> = ({ 
  id,
  sourceCode,
  index,
  onCopy
}) => {
  const [expanded, setExpanded] = useState(false);
  const [renderSuccess, setRenderSuccess] = useState(true);
  
  // 切换展开/折叠状态
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  // 处理渲染结果
  const handleRender = (success: boolean) => {
    setRenderSuccess(success);
  };
  
  return (
    <div className="diagram-item border border-gray-200 rounded mb-3 overflow-hidden bg-white">
      <div className="diagram-header flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-700 mr-2">
            图表 #{index + 1}
          </span>
          {!renderSuccess && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
              渲染失败
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onCopy}
            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded flex items-center"
            title="复制图表源代码"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            复制
          </button>
          
          <button
            onClick={toggleExpand}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center"
          >
            {expanded ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                收起
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                展开
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="diagram-preview p-3">
        <div className="preview-container" style={{ maxHeight: '150px', overflow: 'hidden' }}>
          <MermaidRenderer 
            code={sourceCode}
            onRender={handleRender}
          />
        </div>
      </div>
      
      {expanded && (
        <div className="diagram-code p-3 bg-gray-50 border-t border-gray-200">
          <div className="font-medium text-sm text-gray-700 mb-1">源代码：</div>
          <pre className="text-xs bg-white p-2 border border-gray-200 rounded whitespace-pre-wrap overflow-auto max-h-[200px]">
            {sourceCode}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DiagramItem; 