import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { initMermaid } from '../../utils/mermaid-utils';

// 确保Mermaid只初始化一次
let initialized = false;

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
    /**
     * 主题
     */
    theme?: 'default' | 'forest' | 'dark' | 'neutral';
    
    /**
     * 安全级别
     */
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

  useEffect(() => {
    // 初始化Mermaid (如果尚未初始化)
    if (!initialized) {
      initialized = initMermaid(mermaid);
      
      // 如果配置了主题，应用主题
      if (config.theme) {
        try {
          // @ts-ignore - mermaid类型定义不完整
          mermaid.initialize({ theme: config.theme });
        } catch (error) {
          console.error('设置Mermaid主题失败:', error);
        }
      }
      
      // 如果配置了安全级别，应用安全级别
      if (config.securityLevel) {
        try {
          // @ts-ignore - mermaid类型定义不完整
          mermaid.initialize({ securityLevel: config.securityLevel });
        } catch (error) {
          console.error('设置Mermaid安全级别失败:', error);
        }
      }
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
  }, [code, onRender, renderAttempt, config]);

  // 提供重试渲染的方法
  const retryRender = () => {
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
          <div>Mermaid初始化状态: {initialized ? '成功' : '失败'}</div>
          <div>渲染尝试次数: {renderAttempt}</div>
          <button 
            onClick={retryRender}
            className="mt-1 px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            重试渲染
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