import React from 'react';
import DiagramItem from './DiagramItem';
import { MermaidDiagram } from '../../types/diagram';

interface DiagramListProps {
  diagrams: MermaidDiagram[];
  onCopyDiagram: (id: string, code: string) => void;
}

/**
 * 图表列表组件
 * 显示页面上检测到的所有Mermaid图表
 */
const DiagramList: React.FC<DiagramListProps> = ({ 
  diagrams,
  onCopyDiagram
}) => {
  // 如果没有图表，显示空状态
  if (diagrams.length === 0) {
    return (
      <div className="empty-state p-6 text-center bg-gray-50 border border-gray-200 rounded">
        <div className="text-4xl mb-2">📊</div>
        <h3 className="text-lg font-medium text-gray-700">未检测到Mermaid图表</h3>
        <p className="text-sm text-gray-500 mt-1">
          当前页面没有发现Mermaid图表，请尝试加载包含Mermaid图表的页面
        </p>
      </div>
    );
  }
  
  return (
    <div className="diagram-list">
      {diagrams.map((diagram, index) => (
        <DiagramItem
          key={diagram.id}
          id={diagram.id}
          sourceCode={diagram.sourceCode}
          index={index}
          onCopy={() => onCopyDiagram(diagram.id, diagram.sourceCode)}
        />
      ))}
      
      <div className="text-center text-sm text-gray-500 mt-2">
        共检测到 {diagrams.length} 个Mermaid图表
      </div>
    </div>
  );
};

export default DiagramList; 