import React, { useState } from 'react';
import { MERMAID_EXAMPLES } from '../../utils/mermaid-utils';

interface MermaidEditorProps {
  code: string;
  onChange: (code: string) => void;
}

/**
 * Mermaid编辑器组件
 * 提供代码输入、模板选择等功能
 */
const MermaidEditor: React.FC<MermaidEditorProps> = ({ code, onChange }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // 应用模板
  const applyTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);
    const templateCode = MERMAID_EXAMPLES[templateName as keyof typeof MERMAID_EXAMPLES];
    if (templateCode) {
      onChange(templateCode);
    }
  };
  
  // 清空编辑器
  const clearEditor = () => {
    setSelectedTemplate(null);
    onChange('');
  };
  
  return (
    <div className="mermaid-editor h-full flex flex-col">
      <div className="templates-toolbar flex items-center space-x-2 mb-2 overflow-x-auto p-1">
        <div className="text-sm text-gray-500 whitespace-nowrap mr-1">模板:</div>
        {Object.keys(MERMAID_EXAMPLES).map((templateName) => (
          <button
            key={templateName}
            onClick={() => applyTemplate(templateName)}
            className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
              selectedTemplate === templateName
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {templateName === 'flowchart' && '流程图'}
            {templateName === 'sequenceDiagram' && '时序图'}
            {templateName === 'classDiagram' && '类图'}
            {templateName === 'gantt' && '甘特图'}
            {templateName === 'pieChart' && '饼图'}
            {templateName === 'erDiagram' && 'ER图'}
          </button>
        ))}
        <button
          onClick={clearEditor}
          className="px-2 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-700 whitespace-nowrap ml-auto"
        >
          清空
        </button>
      </div>
      
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 p-3 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        placeholder="在此输入Mermaid代码..."
        spellCheck={false}
      />
      
      <div className="editor-info mt-2 text-xs text-gray-500 flex justify-between">
        <div>行数: {code.split('\n').length}</div>
        <div>字符数: {code.length}</div>
        <a
          href="https://mermaid.js.org/syntax/flowchart.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Mermaid语法参考
        </a>
      </div>
    </div>
  );
};

export default MermaidEditor; 