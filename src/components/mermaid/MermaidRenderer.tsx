import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

export interface MermaidRendererProps {
  /**
   * Mermaid图表代码
   */
  code: string;
  
  /**
   * 渲染回调函数
   * @param success 是否渲染成功
   * @param error 错误信息（如果渲染失败）
   * @param svg SVG元素（如果渲染成功）
   */
  onRender?: (success: boolean, error?: string, svg?: SVGElement) => void;
  
  /**
   * 是否启用调试模式
   */
  debugMode?: boolean;
  
  /**
   * 配置项
   */
  config?: {
    theme?: 'default' | 'forest' | 'dark' | 'neutral';
    securityLevel?: 'strict' | 'loose' | 'antiscript';
  };
}

/**
 * Mermaid渲染器组件
 * 负责将Mermaid代码渲染为SVG图表
 */
const MermaidRenderer: React.FC<MermaidRendererProps> = ({ 
  code, 
  onRender,
  debugMode = false,
  config = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const errorContainerRef = useRef<HTMLDivElement>(null);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const previousCodeRef = useRef<string>('');

  useEffect(() => {
    // 检测代码是否发生变化，发生变化则强制重新渲染
    if (code !== previousCodeRef.current) {
      previousCodeRef.current = code;
      setRenderAttempt(prev => prev + 1);
    }
  }, [code]);

  useEffect(() => {
    // 如果没有代码，或者容器不存在，则不渲染
    if (!code.trim() || !containerRef.current) {
      return;
    }

    // 配置Mermaid (每次渲染前都初始化，确保设置正确)
    try {
      // 初始化配置
      mermaid.initialize({
        startOnLoad: false,
        theme: config.theme || 'default',
        securityLevel: config.securityLevel || 'loose',
        logLevel: 5, // 详细日志
        flowchart: {
          htmlLabels: true,
          curve: 'linear'
        }
      });
      
      // 清空先前的内容
      containerRef.current.innerHTML = '';
      
      // 清空错误信息
      if (errorContainerRef.current) {
        errorContainerRef.current.innerHTML = '';
        errorContainerRef.current.style.display = 'none';
      }
      
      // 创建唯一ID
      const id = `mermaid-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // 尝试直接渲染到容器
      mermaid.render(id, code).then(({ svg, bindFunctions }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
          
          // 如果提供了bindFunctions，应用它
          if (typeof bindFunctions === 'function') {
            bindFunctions(containerRef.current);
          }
          
          // 获取SVG元素
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            // 确保SVG元素可见和可访问
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            
            // 通知父组件渲染成功
            if (onRender) {
              onRender(true, undefined, svgElement as SVGElement);
            }
          } else {
            console.warn('SVG元素未找到，但渲染似乎成功');
            if (onRender) {
              onRender(true);
            }
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
      console.error('Mermaid初始化或渲染时出错:', error);
      
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
  }, [code, onRender, debugMode, config, renderAttempt]);

  // 强制重新渲染的函数
  const forceRerender = () => {
    setRenderAttempt(prev => prev + 1);
  };

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
          <div>渲染尝试次数: {renderAttempt}</div>
          <button 
            onClick={forceRerender}
            className="mt-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
          >
            强制重新渲染
          </button>
          <pre className="mt-1 p-1 bg-gray-100 rounded text-xs overflow-auto" style={{ maxHeight: '100px' }}>
            {code}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MermaidRenderer; 