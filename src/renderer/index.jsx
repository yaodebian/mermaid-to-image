/**
 * Mermaid渲染器入口文件
 * 该文件作为沙盒iframe的入口点，负责初始化Mermaid库并处理图表渲染
 */
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import mermaid from 'mermaid';
import './styles.css';

/**
 * Mermaid渲染器组件
 * 负责初始化Mermaid库并处理图表渲染
 */
const MermaidRenderer = () => {
  // 状态管理
  const [mermaidVersion, setMermaidVersion] = useState('未知');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  
  // DOM引用
  const containerRef = useRef(null);
  const logContainerRef = useRef(null);
  
  // 添加日志
  const addLog = (message, isError = false) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const logMessage = `[${timestamp}] ${message}`;
    
    console[isError ? 'error' : 'log'](`[Mermaid渲染器] ${message}`);
    
    setLogs(prevLogs => {
      const newLogs = [{
        id: Date.now(),
        message: logMessage, 
        isError
      }, ...prevLogs].slice(0, 50); // 限制50条日志
      
      return newLogs;
    });
  };
  
  // 初始化Mermaid
  const initMermaid = () => {
    try {
      addLog('正在初始化Mermaid');
      
      // 检测Mermaid版本
      const version = mermaid.version || '未知';
      setMermaidVersion(version);
      addLog(`检测到Mermaid版本: ${version}`);
      
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        logLevel: 'error',
        er: { useMaxWidth: false },
        flowchart: { useMaxWidth: false },
        sequence: { useMaxWidth: false },
        journey: { useMaxWidth: false },
        gantt: { useMaxWidth: false },
        pie: { useMaxWidth: false }
      });
      
      addLog('Mermaid初始化成功');
      setIsInitialized(true);
      
      // 通知父窗口Mermaid已准备就绪
      window.parent.postMessage({ 
        type: 'mermaid-ready',
        success: true,
        version
      }, '*');
      
      return true;
    } catch (error) {
      addLog(`Mermaid初始化失败: ${error.message}`, true);
      
      // 通知父窗口初始化失败
      window.parent.postMessage({ 
        type: 'mermaid-ready',
        success: false,
        error: error.message,
        version: mermaidVersion
      }, '*');
      
      return false;
    }
  };
  
  // 调整SVG大小
  const adjustSvgSize = (svgElement) => {
    if (!svgElement) return;
    
    // 确保有宽高
    if (!svgElement.hasAttribute('width') || svgElement.getAttribute('width') === '100%' || 
        !svgElement.hasAttribute('height') || svgElement.getAttribute('height') === '100%') {
      
      // 获取SVG的真实尺寸
      let boxWidth, boxHeight;
      try {
        const bbox = svgElement.getBBox();
        boxWidth = bbox.width;
        boxHeight = bbox.height;
      } catch (e) {
        boxWidth = svgElement.getBoundingClientRect().width;
        boxHeight = svgElement.getBoundingClientRect().height;
      }
      
      // 添加内边距
      const padding = 20;
      svgElement.setAttribute('width', (boxWidth + padding) + 'px');
      svgElement.setAttribute('height', (boxHeight + padding) + 'px');
      
      // 如果是IE或其他不支持getBBox的浏览器，添加viewBox
      if (!svgElement.getAttribute('viewBox')) {
        svgElement.setAttribute('viewBox', `0 0 ${boxWidth + padding} ${boxHeight + padding}`);
      }
    }
    
    // 添加一些基本样式
    svgElement.style.maxWidth = '100%';
    svgElement.style.height = 'auto';
    svgElement.style.display = 'block';
    svgElement.style.margin = '0 auto';
  };
  
  // 通知渲染成功
  const notifySuccess = (svgElement, requestId) => {
    if (!svgElement) return;
    
    // 确保消息能够到达父窗口
    try {
      const dimensions = {
        width: svgElement.getBoundingClientRect().width,
        height: svgElement.getBoundingClientRect().height
      };
      
      addLog(`发送渲染成功消息: 宽度=${dimensions.width}, 高度=${dimensions.height}`);
      
      window.parent.postMessage({
        type: 'mermaid-rendered',
        success: true,
        width: dimensions.width,
        height: dimensions.height,
        requestId
      }, '*');
      
      // 兼容性处理：再次发送消息以防首次未被接收
      setTimeout(() => {
        window.parent.postMessage({
          type: 'mermaid-rendered',
          success: true,
          width: dimensions.width,
          height: dimensions.height,
          requestId,
          retried: true
        }, '*');
      }, 100);
    } catch (e) {
      addLog(`通知父窗口失败: ${e.message}`, true);
    }
  };
  
  // 显示语法错误
  const showSyntaxError = (error, code, requestId) => {
    let errorMessage = error.message || '未知错误';
    if (typeof error === 'string') {
      errorMessage = error;
    }
    
    addLog(`显示语法错误: ${errorMessage}`, true);
    
    // 提取错误行信息
    let errorLine = 'Unknown';
    let errorChar = '';
    
    const lineMatch = errorMessage.match(/Line (\d+)/i);
    if (lineMatch) {
      errorLine = lineMatch[1];
    }
    
    const charMatch = errorMessage.match(/character (\d+)/i);
    if (charMatch) {
      errorChar = `, 字符 ${charMatch[1]}`;
    }
    
    // 构建错误代码显示
    let codeLines = null;
    if (errorLine !== 'Unknown' && code) {
      const lines = code.split('\n');
      const errorLineNum = parseInt(errorLine);
      
      // 计算要显示的行范围
      const startLine = Math.max(1, errorLineNum - 2);
      const endLine = Math.min(lines.length, errorLineNum + 2);
      
      codeLines = [];
      for (let i = startLine; i <= endLine; i++) {
        codeLines.push({
          lineNum: i,
          content: lines[i-1] || '',
          isError: i === errorLineNum
        });
      }
    }
    
    // 先完全清空容器
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      
      // 渲染自定义错误信息
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px;">Mermaid语法错误</div>
        <div>错误位置: 第 ${errorLine} 行${errorChar}</div>
        <div>错误信息: ${errorMessage}</div>
      `;
      
      if (codeLines) {
        const codeContainer = document.createElement('div');
        codeContainer.className = 'error-code';
        
        codeLines.forEach(line => {
          const lineDiv = document.createElement('div');
          lineDiv.className = line.isError ? 'error-line' : '';
          lineDiv.textContent = `${line.lineNum}: ${line.content}`;
          codeContainer.appendChild(lineDiv);
        });
        
        errorDiv.appendChild(codeContainer);
      }
      
      containerRef.current.appendChild(errorDiv);
    }
    
    // 通知父窗口渲染失败
    window.parent.postMessage({
      type: 'mermaid-rendered',
      success: false,
      error: `语法错误: 第${errorLine}行${errorChar} - ${errorMessage}`,
      requestId
    }, '*');
  };
  
  // 清空渲染容器
  const clearContainer = (requestId) => {
    addLog('清空渲染容器');
    
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    // 通知父窗口清空成功
    window.parent.postMessage({
      type: 'mermaid-rendered',
      success: true,
      cleared: true,
      requestId
    }, '*');
  };
  
  // 隐藏错误元素
  const hideErrorElements = () => {
    // 隐藏所有可能的错误元素
    const errorElements = document.querySelectorAll('[id^="mermaid-error-"], .mermaid .error, .mermaid-error');
    errorElements.forEach(el => {
      el.style.display = 'none';
    });
    
    if (!containerRef.current) return;
    
    // 仅保留我们自己创建的元素和SVG
    Array.from(containerRef.current.children).forEach(child => {
      if (!child.classList.contains('error-message') && child.tagName.toLowerCase() !== 'svg') {
        child.style.display = 'none';
      }
    });
  };
  
  // 渲染Mermaid图表
  const renderChart = async (code, requestId) => {
    try {
      if (!code || typeof code !== 'string' || !code.trim()) {
        throw new Error('无效的Mermaid代码');
      }
      
      addLog(`开始渲染图表 (${code.length}字符)`);
      setCurrentRequestId(requestId);
      
      // 确保容器存在
      if (!containerRef.current) {
        throw new Error('渲染容器不存在');
      }
      
      // 清空容器，确保之前的内容不会影响新的渲染
      containerRef.current.innerHTML = '';
      
      // 渲染前解析检查语法
      try {
        mermaid.parse(code);
        addLog('语法检查通过');
      } catch (parseError) {
        addLog(`语法错误: ${parseError.message}`, true);
        showSyntaxError(parseError, code, requestId);
        return;
      }
      
      try {
        // 使用React方式渲染Mermaid
        const { svg } = await mermaid.render(`mermaid-svg-${Date.now()}`, code);
        addLog('React渲染成功');
        
        // 添加新渲染的SVG
        containerRef.current.innerHTML = svg;
        
        // 获取SVG元素并确保尺寸正确
        const svgElement = containerRef.current.querySelector('svg');
        if (!svgElement) {
          throw new Error('渲染成功但未找到SVG元素');
        }
        
        // 确保SVG有合适的尺寸和样式
        adjustSvgSize(svgElement);
        
        // 隐藏可能存在的错误视图
        hideErrorElements();
        
        // 通知父窗口渲染成功
        notifySuccess(svgElement, requestId);
      } catch (error) {
        addLog(`渲染失败: ${error.message}`, true);
        
        // 尝试备用方法
        try {
          addLog('尝试备用渲染方法');
          
          // 清空容器
          containerRef.current.innerHTML = '';
          
          // 创建渲染容器
          const renderDiv = document.createElement('div');
          renderDiv.className = 'mermaid';
          renderDiv.textContent = code;
          containerRef.current.appendChild(renderDiv);
          
          // 使用contentLoaded方法进行渲染
          mermaid.contentLoaded();
          
          // 获取渲染后的SVG
          const svgElement = containerRef.current.querySelector('svg');
          if (!svgElement) {
            throw new Error('备用渲染失败');
          }
          
          // 确保SVG尺寸正确
          adjustSvgSize(svgElement);
          
          // 隐藏可能存在的错误视图
          hideErrorElements();
          
          addLog('备用渲染成功');
          notifySuccess(svgElement, requestId);
        } catch (backupError) {
          addLog(`备用渲染失败: ${backupError.message}`, true);
          showSyntaxError(error.message ? error : backupError, code, requestId);
        }
      }
    } catch (error) {
      addLog(`整体渲染过程错误: ${error.message}`, true);
      
      if (containerRef.current) {
        // 清空容器并显示错误信息
        containerRef.current.innerHTML = `
          <div class="error-message">
            渲染错误: ${error.message || '未知错误'}
          </div>
        `;
      }
      
      window.parent.postMessage({
        type: 'mermaid-rendered',
        success: false,
        error: error.message || '未知错误',
        requestId
      }, '*');
    }
  };
  
  // 添加自定义样式，隐藏官方错误视图
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      /* 隐藏Mermaid官方错误视图 */
      .mermaid:not(#container) {
        display: none !important;
      }
      [id^="mermaid-error-"] {
        display: none !important;
      }
      .mermaid .error {
        display: none !important;
      }
      .mermaid-error {
        display: none !important;
      }
      /* 确保其他内联样式不会干扰我们的错误显示 */
      #container > *:not(.error-message):not(svg) {
        display: none !important;
      }
    `;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);
  
  // 初始化Mermaid
  useEffect(() => {
    initMermaid();
  }, []);
  
  // 监听消息
  useEffect(() => {
    const handleMessage = (event) => {
      if (!event.data) return;
      
      if (event.data.type === 'render-mermaid') {
        const requestId = event.data.requestId || Date.now();
        addLog(`收到渲染请求: ${event.data.code?.length || 0}字符, ID: ${requestId}`);
        renderChart(event.data.code, requestId);
      } else if (event.data.type === 'debug-mode') {
        setIsDebugMode(event.data.enabled);
        addLog(`调试模式: ${event.data.enabled ? '开启' : '关闭'}`);
      } else if (event.data.type === 'clear-mermaid') {
        const requestId = event.data.requestId || Date.now();
        addLog(`收到清空请求, ID: ${requestId}`);
        clearContainer(requestId);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  return (
    <div className="mermaid-renderer-container">
      <div id="container" className="mermaid-container" ref={containerRef}></div>
      
      {isDebugMode && (
        <div id="log-container" className="log-container" ref={logContainerRef}>
          <div className="log-header">
            Mermaid渲染器日志 (版本: {mermaidVersion})
            <span className={`status-badge ${isInitialized ? 'success' : 'error'}`}>
              {isInitialized ? '已初始化' : '初始化失败'}
            </span>
          </div>
          
          <div className="log-entries">
            {logs.map(log => (
              <div 
                key={log.id} 
                className={`log-entry ${log.isError ? 'log-error' : ''}`}
              >
                {log.message}
              </div>
            ))}
            
            {logs.length === 0 && (
              <div className="log-empty">暂无日志</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 渲染React组件
ReactDOM.render(
  <MermaidRenderer />,
  document.getElementById('root')
); 