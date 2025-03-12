/**
 * Mermaid渲染器入口文件
 * 该文件作为沙盒iframe的入口点，负责初始化Mermaid库并处理图表渲染
 */
import mermaid from 'mermaid';
import './styles.css';

(function() {
  // DOM元素引用
  const container = document.getElementById('container');
  const logContainer = document.getElementById('log-container');
  let mermaidVersion = 'unknown';
  let attemptCount = 0;
  
  // 日志函数
  function log(message, isError = false) {
    console[isError ? 'error' : 'log'](`[Mermaid渲染器] ${message}`);
    
    if (!logContainer) return;
    
    const entry = document.createElement('div');
    entry.className = `log-entry${isError ? ' log-error' : ''}`;
    entry.textContent = `[${new Date().toISOString().split('T')[1].slice(0, -1)}] ${message}`;
    logContainer.insertBefore(entry, logContainer.firstChild);
    
    // 限制日志条数
    while (logContainer.children.length > 50) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }
  
  // 检测Mermaid版本
  function detectMermaidVersion() {
    try {
      mermaidVersion = mermaid.version || '未知';
      log(`检测到Mermaid版本: ${mermaidVersion}`);
    } catch (e) {
      log(`检测版本出错: ${e.message}`, true);
    }
  }
  
  // 初始化Mermaid
  function initMermaid() {
    try {
      attemptCount++;
      log(`正在初始化Mermaid (第${attemptCount}次尝试)`);
      detectMermaidVersion();
      
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
      
      log('Mermaid初始化成功');
      
      // 通知父窗口Mermaid已准备就绪
      window.parent.postMessage({ 
        type: 'mermaid-ready',
        success: true,
        version: mermaidVersion
      }, '*');
      
      return true;
    } catch (error) {
      log(`Mermaid初始化失败: ${error.message}`, true);
      
      // 通知父窗口初始化失败
      window.parent.postMessage({ 
        type: 'mermaid-ready',
        success: false,
        error: error.message,
        version: mermaidVersion
      }, '*');
      
      return false;
    }
  }
  
  // 使用构建DOM元素的方式渲染Mermaid图表
  function renderChart(code, requestId) {
    try {
      if (!code || typeof code !== 'string' || !code.trim()) {
        throw new Error('无效的Mermaid代码');
      }
      
      log(`开始渲染图表 (${code.length}字符)`);
      
      // 清空容器，确保之前的内容不会影响新的渲染
      container.innerHTML = '';
      
      // 渲染前解析检查语法
      try {
        mermaid.parse(code);
        log('语法检查通过');
      } catch (parseError) {
        log(`语法错误: ${parseError.message}`, true);
        showSyntaxError(parseError, code, requestId);
        return;
      }
      
      try {
        // 尝试通过API直接渲染
        mermaid.render('mermaid-svg-' + Date.now(), code)
          .then(result => {
            log('API渲染成功');
            
            // 先清空容器，移除任何错误信息和之前的渲染内容
            container.innerHTML = '';
            
            // 添加新渲染的SVG
            container.innerHTML = result.svg;
            
            // 获取生成的SVG元素并确保尺寸正确
            const svgElement = container.querySelector('svg');
            if (!svgElement) {
              throw new Error('渲染成功但未找到SVG元素');
            }
            
            // 确保SVG有合适的尺寸和样式
            adjustSvgSize(svgElement);
            
            // 通知父窗口渲染成功
            notifySuccess(svgElement, requestId);
          })
          .catch(err => {
            log(`API渲染失败: ${err.message}`, true);
            // 尝试备用方法
            try {
              log('尝试备用渲染方法');
              
              // 清空容器，准备备用渲染
              container.innerHTML = '';
              
              // 创建一个渲染容器
              const renderDiv = document.createElement('div');
              renderDiv.className = 'mermaid';
              renderDiv.textContent = code;
              container.appendChild(renderDiv);
              
              mermaid.contentLoaded();
              
              // 获取渲染后的SVG
              const svgElement = container.querySelector('svg');
              if (!svgElement) {
                throw new Error('备用渲染失败或未找到SVG');
              }
              
              // 确保SVG尺寸正确
              adjustSvgSize(svgElement);
              
              log('备用渲染成功');
              notifySuccess(svgElement, requestId);
            } catch (backupError) {
              log(`备用渲染失败: ${backupError.message}`, true);
              showSyntaxError(err.message ? err : backupError, code, requestId);
            }
          });
      } catch (error) {
        log(`渲染过程出错: ${error.message}`, true);
        showSyntaxError(error, code, requestId);
      }
    } catch (error) {
      log(`整体渲染过程错误: ${error.message}`, true);
      
      // 清空容器并显示错误信息
      container.innerHTML = `
        <div class="error-message">
          渲染错误: ${error.message || '未知错误'}
        </div>
      `;
      
      window.parent.postMessage({
        type: 'mermaid-rendered',
        success: false,
        error: error.message || '未知错误',
        requestId: requestId
      }, '*');
    }
  }
  
  // 调整SVG大小
  function adjustSvgSize(svgElement) {
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
  }
  
  // 通知渲染成功
  function notifySuccess(svgElement, requestId) {
    // 确保消息能够到达父窗口
    try {
      const dimensions = {
        width: svgElement.getBoundingClientRect().width,
        height: svgElement.getBoundingClientRect().height
      };
      
      log(`发送渲染成功消息: 宽度=${dimensions.width}, 高度=${dimensions.height}`);
      
      window.parent.postMessage({
        type: 'mermaid-rendered',
        success: true,
        width: dimensions.width,
        height: dimensions.height,
        requestId: requestId
      }, '*');
      
      // 兼容性处理：再次发送消息以防首次未被接收
      setTimeout(() => {
        window.parent.postMessage({
          type: 'mermaid-rendered',
          success: true,
          width: dimensions.width,
          height: dimensions.height,
          requestId: requestId,
          retried: true
        }, '*');
      }, 100);
    } catch (e) {
      log(`通知父窗口失败: ${e.message}`, true);
    }
  }
  
  // 显示语法错误
  function showSyntaxError(error, code, requestId) {
    let errorMessage = error.message || '未知错误';
    if (typeof error === 'string') {
      errorMessage = error;
    }
    
    log(`显示语法错误: ${errorMessage}`, true);
    
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
    let codeHighlight = '';
    if (errorLine !== 'Unknown' && code) {
      const lines = code.split('\n');
      const errorLineNum = parseInt(errorLine);
      
      // 计算要显示的行范围
      const startLine = Math.max(1, errorLineNum - 2);
      const endLine = Math.min(lines.length, errorLineNum + 2);
      
      codeHighlight = '<div class="error-code">';
      for (let i = startLine; i <= endLine; i++) {
        const isErrorLine = i === errorLineNum;
        codeHighlight += `<div class="${isErrorLine ? 'error-line' : ''}">${i}: ${lines[i-1] || ''}</div>`;
      }
      codeHighlight += '</div>';
    }
    
    // 渲染错误信息
    container.innerHTML = `
      <div class="error-message">
        <div style="font-weight: bold; margin-bottom: 8px;">Mermaid语法错误</div>
        <div>错误位置: 第 ${errorLine} 行${errorChar}</div>
        <div>错误信息: ${errorMessage}</div>
        ${codeHighlight}
      </div>
    `;
    
    // 通知父窗口渲染失败
    window.parent.postMessage({
      type: 'mermaid-rendered',
      success: false,
      error: `语法错误: 第${errorLine}行${errorChar} - ${errorMessage}`,
      requestId: requestId
    }, '*');
  }
  
  // 监听消息
  window.addEventListener('message', function(event) {
    if (!event.data) return;
    
    if (event.data.type === 'render-mermaid') {
      const requestId = event.data.requestId || Date.now();
      log(`收到渲染请求: ${event.data.code?.length || 0}字符, ID: ${requestId}`);
      renderChart(event.data.code, requestId);
    } else if (event.data.type === 'debug-mode') {
      if (logContainer) {
        logContainer.style.display = event.data.enabled ? 'block' : 'none';
        log(`调试模式: ${event.data.enabled ? '开启' : '关闭'}`);
      }
    }
  });
  
  // 初始化
  function initialize() {
    log('渲染器初始化中');
    initMermaid();
  }
  
  // 当DOM加载完成后初始化
  window.addEventListener('DOMContentLoaded', initialize);
})(); 