import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidRendererProps {
  code: string;
  onRender?: (success: boolean, error?: string, svg?: SVGElement) => void;
  debugMode?: boolean;
}

// 初始化Mermaid配置
const initMermaid = () => {
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose', // 允许点击事件
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65
      },
      gantt: {
        titleTopMargin: 25,
        barHeight: 20,
        barGap: 4,
        topPadding: 50,
        leftPadding: 75
      }
    });
    console.log('Mermaid初始化成功');
    return true;
  } catch (error) {
    console.error('Mermaid初始化失败:', error);
    return false;
  }
};

// 确保Mermaid只初始化一次
let initialized = false;

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ 
  code, 
  onRender,
  debugMode = false 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const errorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初始化Mermaid (如果尚未初始化)
    if (!initialized) {
      initialized = initMermaid();
    }

    // 如果没有代码，或者容器不存在，则不渲染
    if (!code.trim() || !containerRef.current) {
      return;
    }

    // 清空先前的内容
    containerRef.current.innerHTML = '';
    
    // 清空错误信息
    if (errorContainerRef.current) {
      errorContainerRef.current.innerHTML = '';
      errorContainerRef.current.style.display = 'none';
    }

    // 创建Mermaid预处理容器
    const mermaidContainer = document.createElement('div');
    mermaidContainer.className = 'mermaid';
    mermaidContainer.textContent = code;
    containerRef.current.appendChild(mermaidContainer);

    // 使用官方推荐的方式渲染Mermaid
    try {
      mermaid.run({
        nodes: [mermaidContainer]
      }).then((results) => {
        // 确保results是数组且不为空
        if (Array.isArray(results) && results.length > 0) {
          const result = results[0];
          // 渲染成功
          const svgElement = result.svg ? 
            (new DOMParser().parseFromString(result.svg, 'image/svg+xml')).documentElement : 
            containerRef.current?.querySelector('svg');
          
          if (svgElement && containerRef.current) {
            // 确保SVG元素可见和可访问
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            
            // 通知父组件渲染成功
            if (onRender) {
              onRender(true, undefined, svgElement as SVGElement);
            }
          } else {
            // SVG元素不存在，但渲染可能成功
            if (onRender) {
              onRender(true);
            }
          }
        } else {
          console.warn('Mermaid渲染结果异常');
          if (onRender) {
            onRender(true);
          }
        }
      }).catch(error => {
        console.error('Mermaid渲染失败:', error);
        
        // 显示错误信息
        if (errorContainerRef.current) {
          errorContainerRef.current.style.display = 'block';
          errorContainerRef.current.innerHTML = `
            <div class="font-bold mb-1">Mermaid语法错误</div>
            <div class="whitespace-pre-wrap break-words">${error.message || '未知错误'}</div>
          `;
        }
        
        // 通知父组件渲染失败
        if (onRender) {
          onRender(false, error.message || '渲染失败');
        }
      });
    } catch (error) {
      console.error('Mermaid运行时错误:', error);
      
      // 显示错误信息
      if (errorContainerRef.current) {
        errorContainerRef.current.style.display = 'block';
        errorContainerRef.current.innerHTML = `
          <div class="font-bold mb-1">Mermaid运行时错误</div>
          <div class="whitespace-pre-wrap break-words">${error instanceof Error ? error.message : '未知错误'}</div>
        `;
      }
      
      // 通知父组件渲染失败
      if (onRender) {
        onRender(false, error instanceof Error ? error.message : '运行时错误');
      }
    }
  }, [code, onRender]);

  return (
    <div className="mermaid-renderer">
      <div 
        ref={errorContainerRef}
        className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600 mb-2"
        style={{ display: 'none' }}
      />
      
      <div 
        ref={containerRef}
        className="mermaid-container flex justify-center items-center"
        style={{ minHeight: '100px' }}
      />
      
      {debugMode && (
        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
          <div>Mermaid代码长度: {code.length}</div>
          <div>Mermaid初始化状态: {initialized ? '成功' : '失败'}</div>
          <pre className="mt-1 p-1 bg-gray-100 rounded text-xs overflow-auto" style={{ maxHeight: '100px' }}>
            {code}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MermaidRenderer; 