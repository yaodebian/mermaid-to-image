import React from 'react';
import { extractErrorInfo } from '../../utils/mermaid-utils';

interface RenderErrorProps {
  error: string;
  code?: string;
}

/**
 * 渲染错误提示组件
 * 显示Mermaid语法错误的详细信息和错误所在行
 */
const RenderError: React.FC<RenderErrorProps> = ({ error, code }) => {
  const { errorLine, errorChar } = extractErrorInfo(error);
  
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
      
      <div className="mt-3 text-xs text-gray-600">
        <div>常见语法错误:</div>
        <ul className="list-disc pl-5 mt-1">
          <li>缺少关键字（如graph、sequenceDiagram等）</li>
          <li>箭头格式错误（应使用 --&gt;, --&gt;&gt;, -.-, 等）</li>
          <li>节点ID中含有特殊字符</li>
          <li>缩进或格式问题</li>
        </ul>
      </div>
    </div>
  );
};

export default RenderError; 